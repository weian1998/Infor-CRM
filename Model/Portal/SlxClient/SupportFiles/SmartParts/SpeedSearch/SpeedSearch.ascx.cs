using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.IO;
using System.Reflection;
using System.Text;
using System.Web.UI;
using System.Web.UI.WebControls;
using Sage.Entity.Interfaces;
using Sage.Platform;
using Sage.Platform.Application;
using Sage.Platform.Application.UI;
using Sage.Platform.Configuration;
using Sage.Platform.Data;
using Sage.Platform.Orm;
using Sage.Platform.Orm.Attributes;
using Sage.Platform.Repository;
using Sage.Platform.Security;
using Sage.Platform.WebPortal;
using Sage.Platform.WebPortal.Services;
using Sage.Platform.WebPortal.SmartParts;
using Sage.SalesLogix.Orm;
using Sage.SalesLogix.Security;
using Sage.SalesLogix.Services.SpeedSearch;
using Sage.SalesLogix.Services.SpeedSearch.SearchSupport;
using Enumerable = System.Linq.Enumerable;

public partial class SmartParts_SpeedSearch : UserControl, ISmartPartInfoProvider
{
    // This controls which of two paging mechanisms is used to handle switching between
    // pages of search results (i.e., items 1-10, 11-20, etc.).
    //
    // If true, SearchResults are stored in a session variable, so when a different page
    // is requested, the results are available.  This is easy and quick, but can require
    // a lot of memory on a high-traffic site as sessions accumulate, and also makes
    // load-balancing with multiple servers more difficult.
    //
    // If false, SearchResults are re-generated for each page, so nothing has to be
    // kept in the Session.  This is somewhat more complicated but eliminates
    // the need to keep Session data on the server, and therefore is recommended, especially
    // for high-traffic sites.
    private int _whichResultsPage;
    private int _totalDocCount;
    private SpeedSearchResults _results;
    private const int ItemsPerPage = 10;
    private List<IIndexDefinition> _indexes;
    private readonly List<DBIndexDefinition> _dbIndexDefs = new List<DBIndexDefinition>();
    private readonly Dictionary<string, SlxFieldDefinition> _searchFilters =
        new Dictionary<string, SlxFieldDefinition>(StringComparer.InvariantCultureIgnoreCase);
    private Dictionary<string, Type> _tablesEntities;
    private string _currentIndexName = string.Empty;
    private int _userType = 1;
    private bool _displayLink;
    private SpeedSearchState _state;
    private EntityBase _resultEntity;
    private string _resultProperty = string.Empty;
    private string _childPropertyName = string.Empty;
    private string _terms = string.Empty;

    #region Services

    private ConfigurationManager _context;
    public SLXUserService UserService { get; set; }

    [ServiceDependency]
    public IWebDialogService DialogService { get; set; }

    private IEntityContextService _mEntityContextService;
    private WorkItem _workItem;
    [Microsoft.Practices.Unity.InjectionMethod]
    public void InitEntityContext([ServiceDependency]WorkItem parentWorkItem)
    {
        _workItem = parentWorkItem;
        _mEntityContextService = _workItem.Services.Get<IEntityContextService>();
    }

    #endregion

    #region Web Form Designer generated code

    override protected void OnInit(EventArgs e)
    {
        base.OnInit(e);
    }

    #endregion

    protected string Localize(string key, string defaultValue)
    {
        var result = GetLocalResourceObject(key);
        if (result != null)
            return result as string;
        result = GetGlobalResourceObject("SpeedSearch", key);
        return result != null ? result as string : defaultValue;
    }

    protected void Page_Load(object sender, EventArgs e)
    {
        _context = ApplicationContext.Current.Services.Get<ConfigurationManager>();
        if (Visible)
        {
            if ((DialogService.SmartPartMappedID == "SpeedSearch") && (DialogService.DialogParameters.Count > 0))
            {
                _childPropertyName = DialogService.DialogParameters["ChildName"].ToString();
                _resultProperty = DialogService.DialogParameters["EntityProperty"].ToString();
            }
            _context = ApplicationContext.Current.Services.Get<ConfigurationManager>();
            UserService = ApplicationContext.Current.Services.Get<IUserService>() as SLXUserService;
            if (UserService is IWebPortalUserService)
            {
                _userType = 0;
            }
            SearchResultsGrid.PageIndexChanged += SearchResultsGrid_PageIndexChanged;
            LoadIndexes();
            CreateIndexControls();
            GenerateScript();
            // instance of the context
            var context = Sage.Platform.Application.ApplicationContext.Current.Services.Get<IContextService>(true);
            // check for query string values first
            if (Request.QueryString["terms"] != null)
            {
                // push it into the front of the process
                _terms = Request.QueryString["terms"];
                context.SetContext("SearchRequestText", _terms);
            }
            if (context.HasContext("SearchRequestText"))
            {
                InitializeState();
                SearchRequest.Text = (string)context.GetContext("SearchRequestText");
                context.RemoveContext("SearchRequestText");
                SearchButton_Click(null, null);
                return;
            }

            if (Session[ClientID] != null)
            {
                InitResults(Session[ClientID].ToString());
                var resultSet = (DataSet)Session[ClientID + "DataSet"];
                ShowPage(resultSet);
                if ((DialogService.SmartPartMappedID == "SpeedSearch") && (DialogService.DialogParameters.Count > 0) && (Page.Request.Browser.Browser != "IE"))
                {
                    var parent = Parent;
                    while (!(parent == null || parent is UpdatePanel))
                    {
                        parent = parent.Parent;
                    }
                    if (parent != null)
                    {
                        ((UpdatePanel)parent).Update();
                    }
                }
            }
        }
    }

    private void GenerateScript()
    {
        var script = new StringBuilder();
        script.AppendLine("function ToggleAdvanced(hyperLinkId) {");
        script.AppendLine("    var adv = document.getElementById('Advanced');");
        script.AppendFormat("    var btn = document.getElementById('{0}');", btnAdvanced.ClientID);
        script.AppendFormat("    adv.style.display === 'none' ? btn.innerHTML = '{0}' : btn.innerHTML = '{1}';", GetLocalResourceObject("SpeedSearch_href_Standard.Text"), GetLocalResourceObject("SpeedSearch_href_Advanced.Text"));
        script.AppendLine("    adv.style.display === 'none' ? adv.style.display = 'block' : adv.style.display = 'none';");
        script.AppendLine("}");
        script.AppendLine("function GetPreviewDoc(id, preview) {");
        script.AppendLine("    var vdocId = id;");
        script.AppendLine("    if (preview === \"false\") {");
        script.AppendLine("        vdocId = \"NoAccess\";");
        script.AppendLine("    }");
        script.AppendFormat("  var vURL = \"SLXSearchDocHandler.aspx?docid=\" + vdocId + \"&clientid={0}\";", ClientID);
        script.AppendLine("    var xhrArgs = {");
        script.AppendLine("        url: vURL, handleAs: 'text', load: function(results) {");
        script.AppendLine("            if (results === 'NOTAUTHENTICATED') {return window.location.reload(true);}");
        script.AppendLine("            var vwin = window.open();");
        script.AppendLine("            if (vwin)");
        script.AppendLine("            {");
        script.AppendLine("                var oNewDoc = vwin.document.open('text/html', 'Preview');");
        script.AppendLine("                oNewDoc.write(results); oNewDoc.close();");
        script.AppendFormat("            }} else {{ alert('{0}'); }}", GetLocalResourceObject("SpeedSearch_Preview_Blocked_Error"));
        script.AppendLine("        }, error: function(error) {alert('Error:' + error);}");
        script.AppendLine("    };");
        script.AppendLine("    var deferred = dojo.xhrGet(xhrArgs);");
        script.AppendLine("}");
        script.AppendLine("function MarkUsed(docId, index, identifier, dbid, id) {");
        script.AppendFormat("    var info = document.getElementById('{0}');", MarkUsedInfo.ClientID);
        script.AppendFormat("    var currentIdx = document.getElementById('{0}');", currentIndex.ClientID);
        script.AppendLine("    currentIdx.value = id;");
        script.AppendLine("    info.value = docId + \"|\" + index + \"|\" + identifier + \"|\" + dbid;");
        script.AppendLine("    if (Sys)");
        script.AppendLine("    {");
        script.AppendFormat("        Sys.WebForms.PageRequestManager.getInstance()._doPostBack('{0}', null);",
                            HiddenField0.ClientID);
        script.AppendLine("    }");
        script.AppendLine("    else");
        script.AppendLine("    {");
        script.AppendLine("        document.forms(0).submit();");
        script.AppendLine("    }");
        script.AppendLine("}");
        script.AppendLine("function ReturnResult(id) {");
        script.AppendFormat("        var postBackBtn = document.getElementById(\"{0}\");", btnReturnResult.ClientID);
        script.AppendFormat("        var returnResultAction = document.getElementById(\"{0}\");", ReturnResultAction.ClientID);
        script.AppendFormat("        var currentIdx = document.getElementById(\"{0}\");", currentIndex.ClientID);
        script.AppendFormat("        var info = document.getElementById('{0}');", MarkUsedInfo.ClientID);
        script.AppendLine("        info.value = \"\";");
        script.AppendLine("        currentIdx.value = id;");
        script.AppendLine("        returnResultAction.value = '1';");
        script.AppendLine("        postBackBtn.click();");
        script.AppendLine("        currentIdx.value = \"\";");
        script.AppendLine("}");
        script.AppendLine("function HandleEnterKeyEvent(e) {");
        script.AppendLine("    if (!e) var e = window.event;");
        script.AppendLine("    if (e.keyCode == 13) //Enter");
        script.AppendLine("    {");
        script.AppendLine("        e.returnValue = false;");
        script.AppendLine("        e.cancelBubble = true;");
        script.AppendLine("        if (e.stopPropagation) e.stopPropagation();");
        script.AppendFormat("        var btn = document.getElementById(\"{0}\");", SearchButton.ClientID);
        script.AppendLine("        if (document.createEvent)");
        script.AppendLine("        {");
        script.AppendFormat("            __doPostBack('{0}', 'OnClick'); ", SearchButton.UniqueID);
        script.AppendLine("        }");
        script.AppendLine("        else");
        script.AppendLine("        {");
        script.AppendLine("            btn.click();");
        script.AppendLine("        }");
        script.AppendLine("    }");
        script.AppendLine("}");
        ScriptManager.RegisterStartupScript(Page, GetType(), ClientID, script.ToString(), true);
    }

    protected override void OnPreRender(EventArgs e)
    {
        if (Visible)
        {
            InitializeState();
            if (!string.IsNullOrEmpty(MarkUsedInfo.Value))
            {
                SetItemAsUsed();
                MarkUsedInfo.Value = string.Empty;
            }
            if (!string.IsNullOrEmpty(ReturnResultAction.Value))
            {
                ReturnResult();
                ReturnResultAction.Value = string.Empty;
                var page = Page as WebPortalPage;
                if (page != null)
                {
                    var refresher = page.PageWorkItem.Services.Get<IPanelRefreshService>();
                    if (refresher != null)
                    {
                        refresher.RefreshAll();
                    }
                }
            }
            if (!string.IsNullOrEmpty(currentIndex.Value))
            {
                var document = new Literal();
                if (currentIndex.Value.Equals("NoAccess"))
                {
                    document.Text = GetLocalResourceObject("SpeedSearch_Result_NoAccess").ToString();
                }
                else
                {
                    var index = (string.IsNullOrEmpty(CurrentPageIndex.Value)) ? 0 : int.Parse(CurrentPageIndex.Value);
                    _whichResultsPage = index;
                    var ss = new SpeedSearchService();
                    var ssq = BuildQuery();
                    ssq.DocTextItem = int.Parse(currentIndex.Value);
                    _results = ss.DoSpeedSearch(ssq);
                    document.Text = _results.Items[0].HighlightedDoc;
                }
                currentIndex.Value = "";
                FirstPage.Visible = true;
                PreviousPage.Visible = true;
                NextPage.Visible = true;
                LastPage.Visible = true;
            }
        }
        base.OnPreRender(e);
    }

    private void CreateIndexControls()
    {
        if (_indexes != null)
        {
            var outerDiv = new Literal {Text = "<div style='border:solid 1px #cccccc;overflow-y:scroll;height:160px;'>"};
            PlaceHolder1.Controls.Add(outerDiv);

            var itemCount = 0;
            foreach (var id in _indexes)
            {
                if (id.Type == 1)
                {
                    var dbid = DBIndexDefinition.SetFromString(id.MetaData);
                    _dbIndexDefs.Add(dbid);
                    foreach (var fd in dbid.FilterFields)
                    {
                        fd.IndexType = 1;
                        SlxFieldDefinition temp;
                        if (_searchFilters.ContainsKey(fd.DisplayName))
                        {
                            _searchFilters.TryGetValue(fd.DisplayName, out temp);
                            temp.CommonIndexes += "," + id.IndexName;
                            _searchFilters.Remove(fd.DisplayName);
                        }
                        else
                        {
                            temp = SlxFieldDefinition.SetFromString(fd.GetAsString());
                            temp.CommonIndexes = id.IndexName;
                        }
                        _searchFilters.Add(temp.DisplayName, temp);
                    }
                }
                else
                {
                    if (!_searchFilters.ContainsKey("File Name"))
                    {
                        var fd = new SlxFieldDefinition {DisplayName = "filename", FieldType = 1, IndexType = 0};
                        _searchFilters.Add("File Name", fd);
                    }
                    if (!_searchFilters.ContainsKey("File Last Modified"))
                    {
                        var fd = new SlxFieldDefinition {DisplayName = "date", FieldType = 11, IndexType = 0};
                        _searchFilters.Add("File Last Modified", fd);
                    }
                    if (!_searchFilters.ContainsKey("File Date Created"))
                    {
                        var fd = new SlxFieldDefinition {DisplayName = "created", FieldType = 11, IndexType = 0};
                        _searchFilters.Add("File Date Created", fd);
                    }
                }
                var rowDiv = new Literal {Text = "<div>"};
                PlaceHolder1.Controls.Add(rowDiv);

                var cb = new CheckBox
                {
                    ID = "Index" + itemCount,
                    Text = Localize(IndexDefinitionToResourceKey(id), id.IndexName)
                };
                cb.LabelAttributes.Add("id", "lblIndex" + itemCount);
                cb.Checked = true;
                cb.Style.Add(HtmlTextWriterStyle.MarginLeft, "5px");
                cb.CssClass = "inforAspCheckBox";
                PlaceHolder1.Controls.Add(cb);

                var endRowDiv = new Literal {Text = "</div>"};
                PlaceHolder1.Controls.Add(endRowDiv);
                itemCount++;
            }
            var endouterDiv = new Literal {Text = "</div>"};
            PlaceHolder1.Controls.Add(endouterDiv);
        }
        CreateFilterControls();
    }

    private static string StripSpecialChars(string text)
    {
        text = text.Replace(" ", "_");
        text = text.Replace(".", "_");
        text = text.Replace("-", "_");
        text = text.Replace("=", "_");
        text = text.Replace("!", "_");
        text = text.Replace("?", "_");
        return text.Replace("#", "_");
    }

    private static string IndexDefinitionToResourceKey(IIndexDefinition definition)
    {
        return String.Format("INDEX_{0}", StripSpecialChars(definition.IndexName)).ToUpper();
    }

    private static string FieldDefinitionToResourceKey(SlxFieldDefinition definition)
    {
        var name = definition.DisplayName;

        //fix custom created ones from above (so the keys are more descriptive).
        switch (name)
        {
            case "filename":
                name = "File Name";
                break;
            case "date":
                name = "File Last Modified";
                break;
            case "created":
                name = "File Date Created";
                break;
        }

        return String.Format("FILTER_{0}", StripSpecialChars(name)).ToUpper();
    }

    private void CreateFilterControls()
    {
        var outerDiv = new Literal
        {
            Text = "<div style='border:solid 1px #B3B3B3;overflow-y:scroll;height:160px;'><table style='width:100%'>"
        };
        PlaceHolder2.Controls.Add(outerDiv);

        // Add Frequently Used filter to the top.
        var freqrow = new Literal {Text = "<tr><td colspan='2' style='word-wrap:normal;'>"};
        PlaceHolder2.Controls.Add(freqrow);

        var freqlbl = new Label {Text = GetLocalResourceObject("SpeedSearch_Label_FrequentlyUsed").ToString()};
        freqlbl.Style.Add(HtmlTextWriterStyle.MarginLeft, "5px");
        PlaceHolder2.Controls.Add(freqlbl);

        var freqCol2 = new Literal {Text = "</td><td style='width:55%'>"};
        PlaceHolder2.Controls.Add(freqCol2);

        var cb = new CheckBox {ID = "FreqUsed", Checked = false, CssClass = "inforAspCheckBox", Text = " "};
        PlaceHolder2.Controls.Add(cb);

        var freqEndCol = new Literal {Text = "</td></tr>"};
        PlaceHolder2.Controls.Add(freqEndCol);
        var idx = 0;
        foreach (string key in _searchFilters.Keys)
        {
            var row = new Literal {Text = "<tr><td style='width:30%;word-wrap:normal;'>"};
            PlaceHolder2.Controls.Add(row);

            SlxFieldDefinition fd;
            _searchFilters.TryGetValue(key, out fd);
            var lbl = new Label
            {
                ID = "lblFilterField" + idx,
                Text = Localize(FieldDefinitionToResourceKey(_searchFilters[key]), key.Replace('_', ' '))
            };
            lbl.Style.Add(HtmlTextWriterStyle.MarginLeft, "5px");
            PlaceHolder2.Controls.Add(lbl);

            var nextCol = new Literal {Text = "</td><td style='width:10%'>"};
            PlaceHolder2.Controls.Add(nextCol);

            var lbl2 = new Label
            {
                ID = "lblFilterType" + idx,
                Text =
                    fd.FieldType == 11
                        ? Localize("SpeedSearch_Filter_Within", "Within")
                        : Localize("SpeedSearch_Filter_Like", "Like")
            };
            PlaceHolder2.Controls.Add(lbl2);

            var nextCol2 = new Literal {Text = "</td><td style='width:45%'>"};
            PlaceHolder2.Controls.Add(nextCol2);

            var txt = new TextBox {Width = new Unit("90%"), ID = fd.DisplayName};
            PlaceHolder2.Controls.Add(txt);

            var endCol = new Literal {Text = "</td></tr>"};
            PlaceHolder2.Controls.Add(endCol);
            idx++;
        }

        var endouterDiv = new Literal();
        endouterDiv.Text = "</table></div>";
        PlaceHolder2.Controls.Add(endouterDiv);
    }

    protected void SearchButton_Click(object sender, EventArgs e)
    {
        CurrentPageIndex.Value = "0";
        _whichResultsPage = 0;
        DoSearch();
        ShowPage();
    }

    protected void SortByDateButton_Click(object sender, EventArgs e)
    {
        _whichResultsPage = 0;
        DoSearch();
        ShowPage();
    }

    private void ReturnResult()
    {
        InitializeState();
        var index = (string.IsNullOrEmpty(CurrentPageIndex.Value)) ? 0 : int.Parse(CurrentPageIndex.Value);
        if (string.IsNullOrEmpty(currentIndex.Value)) return;
        _whichResultsPage = index;
        var ss = new SpeedSearchService();
        var ssq = BuildQuery();
        ssq.DocTextItem = int.Parse(currentIndex.Value) + 1000000;
        _results = ss.DoSpeedSearch(ssq);

        _resultEntity = (EntityBase)_mEntityContextService.GetEntity();
        if (!string.IsNullOrEmpty(_childPropertyName))
        {
            var child = TypeDescriptor.GetProperties(_resultEntity.GetType())[_childPropertyName];
            _resultEntity = (EntityBase)child.GetValue(_resultEntity);
        }
        var resultProp = TypeDescriptor.GetProperties(_resultEntity.GetType())[_resultProperty];
        resultProp.SetValue(_resultEntity, _results.Items[0].HighlightedDoc);

        DialogService.CloseEventHappened(null, null);
    }

    public void DoSearch()
    {
        currentIndex.Value = "";
        _state = new SpeedSearchState
        {
            SearchText = SearchRequest.Text,
            SearchTypeIdx = SearchType.SelectedIndex,
            Root = SearchFlags.Items[0].Selected,
            Thesaurus = SearchFlags.Items[1].Selected,
            SoundsLike = SearchFlags.Items[2].Selected,
            MaxResults = int.Parse(MaxResults.SelectedValue)
        };
        var ss = new SpeedSearchService();
        var ssq = BuildQuery();

        Session[ClientID + "_SearchQry"] = ssq.GetAsXml();
        string xml = ss.DoSpeedSearch(ssq).GetAsXml();
        Session[ClientID] = xml;

        InitResults(xml);
        if (!_context.IsConfigurationTypeRegistered(typeof(SpeedSearchState)))
        {
            _context.RegisterConfigurationType(typeof(SpeedSearchState));
        }
        _context.WriteConfiguration(_state);
    }

    private void InitResults(string resultsXml)
    {
        _results = SpeedSearchResults.LoadFromXml(resultsXml);
        _totalDocCount = _results.TotalCount;
        var max = int.Parse(MaxResults.SelectedValue);
        if ((max > 0) && (_totalDocCount > max))
        {
            _totalDocCount = max;
        }
        if (_totalDocCount > 0)
        {
            FirstPage.Visible = true;
            PreviousPage.Visible = true;
            NextPage.Visible = true;
            LastPage.Visible = true;
        }
        var startPage = (_totalDocCount > 0) ? ((_whichResultsPage * 10) + 1) : 0;
        var end = (_whichResultsPage + 1) * 10;
        if (end > _totalDocCount)
        {
            end = _totalDocCount;
        }
        PagingLabel.Text = string.Format(GetLocalResourceObject("SpeedSearch_Label_PagingLabel").ToString(),
            startPage, end, _totalDocCount);
        TotalCount.Value = _totalDocCount.ToString();
    }

    private SpeedSearchQuery BuildQuery()
    {
        var ssq = new SpeedSearchQuery {SearchText = SearchRequest.Text};
        if (string.IsNullOrEmpty(ssq.SearchText))
        {
            throw new UserObservableException(GetLocalResourceObject("SpeedSearch_Error_Keyword_Required").ToString());
        }
        ssq.SearchType = SearchType.SelectedIndex;
        ssq.IncludeStemming = SearchFlags.Items[0].Selected;
        ssq.IncludeThesaurus = SearchFlags.Items[1].Selected;
        ssq.IncludePhonic = SearchFlags.Items[2].Selected;
        ssq.WhichPage = _whichResultsPage;
        ssq.ItemsPerPage = 10;
        _state.SelectedIndexes.Clear();
        for (var i = 0; i < _indexes.Count; i++)
        {
            var thisIndex = (CheckBox)PlaceHolder1.FindControl("Index" + i);
            if ((thisIndex != null) && (thisIndex.Checked))
            {
                ssq.Indexes.Add(new SpeedSearchIndex(_indexes[i].IndexName, _indexes[i].Type.Value, _indexes[i].IsSecure ?? false));
                _state.SelectedIndexes.Add(i);
            }
        }
        if (ssq.Indexes.Count == 0)
        {
            throw new UserObservableException(GetLocalResourceObject("SpeedSearch_Error_Index_Required").ToString());
        }
        var freqfilter = (CheckBox)PlaceHolder2.FindControl("FreqUsed");
        if ((freqfilter != null) && (freqfilter.Checked))
        {
            ssq.UseFrequentFilter = true;
        }
        foreach (var fd in _searchFilters.Values)
        {
            var filter = (TextBox)PlaceHolder2.FindControl(fd.DisplayName);
            if ((filter != null) && (!string.IsNullOrEmpty(filter.Text)))
            {
                ssq.Filters.Add(new SpeedSearchFilter(fd.DisplayName, filter.Text, fd.CommonIndexes, fd.FieldType, fd.IndexType));
            }
        }
        return ssq;
    }

    public void ShowPage()
    {
        ShowPage(null);
    }

    public void ShowPage(DataSet resultSet)
    {
        // Do not display the grid if there are no results
        PagingLabel.Visible = true;
        if ((_results != null) && (_results.Items.Count == 0))
        {
            SearchResultsGrid.Visible = false;
            StatusLabel.Visible = true;
            if (!String.IsNullOrEmpty(_results.ErrorMessage))
            {
                StatusLabel.Text = _results.ErrorMessage;
                PagingLabel.Visible = false;
            }
            else
            {
                StatusLabel.Text = GetLocalResourceObject("SpeedSearch_Label_NoResults").ToString();
            }
        }
        else
        {
            StatusLabel.Visible = false;
            SearchResultsGrid.Visible = true;
        }

        // Populate the DataGrid
        SearchResultsGrid.DataSource = resultSet;
        if (resultSet == null)
        {
            SearchResultsGrid.DataSource = ResultsToDataSet();
            Session[ClientID + "DataSet"] = SearchResultsGrid.DataSource;
        }
        SearchResultsGrid.PageSize = ItemsPerPage;
        SearchResultsGrid.CurrentPageIndex = _whichResultsPage;
        SearchResultsGrid.VirtualItemCount = _totalDocCount;
        SearchResultsGrid.DataBind();
        _results = null;
    }

    private void InitializeState()
    {
        if (_state == null)
        {
            if (!_context.IsConfigurationTypeRegistered(typeof(SpeedSearchState)))
            {
                _context.RegisterConfigurationType(typeof(SpeedSearchState));
            }
            _state = _context.GetConfiguration<SpeedSearchState>();
        }
        if ((_state != null) && (_state.SelectedIndexes.Count > 0))
        {
            SearchRequest.Text = _state.SearchText;
            SearchType.SelectedIndex = _state.SearchTypeIdx;
            MaxResults.SelectedValue = _state.MaxResults.ToString();
            SearchFlags.Items[0].Selected = _state.Root;
            SearchFlags.Items[1].Selected = _state.Thesaurus;
            SearchFlags.Items[2].Selected = _state.SoundsLike;
            for (var idx = 0; idx < _indexes.Count; idx++)
            {
                var thisIndex = (CheckBox)PlaceHolder1.FindControl("Index" + idx);
                if (thisIndex != null)
                {
                    thisIndex.Checked = _state.SelectedIndexes.Contains(idx);
                }
            }
        }
    }
    private DataSet ResultsToDataSet()
    {
        var dataSet = new DataSet();
        var dataTable = new DataTable("SearchResults");
        dataTable.Columns.Add(new DataColumn("Score")); //0
        dataTable.Columns.Add(new DataColumn("HitCount")); //1
        dataTable.Columns.Add(new DataColumn("DisplayName")); //2
        dataTable.Columns.Add(new DataColumn("HighlightLink")); //3
        dataTable.Columns.Add(new DataColumn("DirectLink")); //4
        dataTable.Columns.Add(new DataColumn("Date")); //5
        dataTable.Columns.Add(new DataColumn("Size")); //6
        dataTable.Columns.Add(new DataColumn("Synopsis")); //7
        dataTable.Columns.Add(new DataColumn("Source")); //8
        dataTable.Columns.Add(new DataColumn("RelationName1")); //9
        dataTable.Columns.Add(new DataColumn("RelationLink1")); //10
        dataTable.Columns.Add(new DataColumn("RelationName2")); //11
        dataTable.Columns.Add(new DataColumn("RelationLink2")); //12
        dataTable.Columns.Add(new DataColumn("RelationName3")); //13
        dataTable.Columns.Add(new DataColumn("RelationLink3")); //14
        dataTable.Columns.Add(new DataColumn("RelationName4")); //15
        dataTable.Columns.Add(new DataColumn("RelationLink4")); //16
        dataTable.Columns.Add(new DataColumn("FullDoc")); //17
        dataTable.Columns.Add(new DataColumn("AllowPreview")); //18
        dataTable.Columns.Add(new DataColumn("DisplayReturnResult")); //19

        foreach (SpeedSearchResultItem item in _results.Items)
        {
            var row = dataTable.NewRow();
            int start = item.IndexRetrievedFrom.LastIndexOf("\\") + 1;
            _currentIndexName = item.IndexRetrievedFrom.Substring(start, item.IndexRetrievedFrom.Length - start);
            var currentIdx = _indexes.Find(IndexNameMatch);
            row[0] = item.ScorePercent;
            row[1] = item.HitCount;

            if (currentIdx.Type == 0)
            {
                row[2] = item.DisplayName;
                row[3] = item.FileName;
                if (item.IndexRetrievedFrom.Contains("\\Attachment"))
                {
                    var pathEndIdx = item.FileName.LastIndexOf("\\");
                    if ((item.FileName.Length > pathEndIdx +13) && (item.FileName[pathEndIdx +1] == '!'))
                    {
                        var key = item.FileName.Substring(pathEndIdx + 2, 12);
                        row[3] = string.Format("javascript:Sage.Utility.File.Attachment.getAttachment('{0}')", key);
                    }
                }
                row[18] = "true";
            }
            else
            {
                var tempName = item.DisplayName;
                var idx = tempName.Length - 12;
                var key = tempName.Substring(idx);
                var tableName = tempName.Substring(0, tempName.IndexOf(" "));

                row[2] = GetEntityDisplay(GetEntityFromTable(tableName), key, item.DisplayName);
                row[18] = "false";
                if (_displayLink)
                {
                    row[18] = "true";
                    if (tableName == "TICKETPROBLEMSOLUTIONTYPE")
                    {
                        var problemSolution = EntityFactory.GetById<ITicketProblemSolutionType>(key);
                        if (problemSolution != null)
                        {
                            tableName = "TICKETPROBLEMTYPE";
                            key = problemSolution.TicketProblemType.Id.ToString();
                        }
                    }
                    var path = Page.ResolveUrl(string.Format("{0}.aspx", tableName));
                    path = Page.MapPath(path);
                    if (File.Exists(path))
                    {
                        row[3] = string.Format("javascript:Link.entityDetail('{1}', '{0}')", key, tableName);
                    }
                }
                else if (UserService is IWebPortalUserService)
                {
                    row[18] = "true";
                }
            }
            row[5] = item.ModifiedDate;
            row[6] = item.Size / 1024;
            string tempval = item.Synopsis; //&lt;a NAME=TheBody&gt;&lt;/a&gt;
            if (tempval.IndexOf("&lt;a NAME=TheBody&gt;&lt;/a&gt;") > 0)
            {
                tempval = tempval.Remove(tempval.IndexOf("&lt;a NAME=TheBody&gt;&lt;/a&gt;"), 32);
            }
            row[7] = tempval;
            // look up value in App_GlobalResources\SpeedSearch.resx. If not found, use whatever value came back from SS service.
            var sourceValue = _currentIndexName;
            var globalResource = GetGlobalResourceObject("SpeedSearch", string.Format("INDEX_{0}",
                                                             _currentIndexName.Replace(" ", "_").ToUpperInvariant()));
            if (globalResource != null) sourceValue = globalResource.ToString();
            row[8] = sourceValue;
            if (item.Fields.ContainsKey("accountid"))
            {
                row[9] = GetEntityDisplay(GetEntityFromTable("ACCOUNT"), item.Fields["accountid"]);
                if (_displayLink)
                {
                    row[10] = string.Format("../../{1}.aspx?entityId={0}", item.Fields["accountid"], "ACCOUNT");
                }
            }
            if (item.Fields.ContainsKey("contactid"))
            {
                row[11] = GetEntityDisplay(GetEntityFromTable("CONTACT"), item.Fields["contactid"]);
                if (_displayLink)
                {
                    row[12] = string.Format("../../{1}.aspx?entityId={0}", item.Fields["contactid"], "CONTACT");
                }
            }
            if (item.Fields.ContainsKey("opportunityid"))
            {
                row[13] = GetEntityDisplay(GetEntityFromTable("OPPORTUNITY"), item.Fields["opportunityid"]);
                if (_displayLink)
                {
                    row[14] = string.Format("../../{1}.aspx?entityId={0}", item.Fields["opportunityid"], "OPPORTUNITY");
                }
            }
            if (item.Fields.ContainsKey("ticketid"))
            {
                row[15] = GetEntityDisplay(GetEntityFromTable("TICKET"), item.Fields["ticketid"]);
                if (_displayLink)
                {
                    row[16] = string.Format("../../{1}.aspx?entityId={0}", item.Fields["ticketid"], "TICKET");
                }
            }
            row[17] = item.HighlightedDoc;
            row[19] = "none";
            if ((!string.IsNullOrEmpty(_resultProperty)) && (row[18].ToString() == "true"))
            {
                row[19] = "block";
            }
            dataTable.Rows.Add(row);
        }
        dataSet.Tables.Add(dataTable);
        return dataSet;
    }

    private bool IndexNameMatch(IIndexDefinition value)
    {
        return value.IndexName.Equals(_currentIndexName);
    }

    private void SetItemAsUsed()
    {
        var items = MarkUsedInfo.Value.Split('|');
        var rep = EntityFactory.GetRepository<IIndexStatistics>();
        var qry = (IQueryable)rep;
        var ef = qry.GetExpressionFactory();
        var crit = qry.CreateCriteria();
        var stats = crit.Add(ef.Eq("Id", items[0])).UniqueResult<IIndexStatistics>();
        if (stats != null)
        {
            stats.TotalCount++;
            stats.LastHitDate = DateTime.Now.ToUniversalTime();
            if (_userType == 0)
            {
                stats.CustomerHitCount++;
            }
            else
            {
                stats.EmployeeHitCount++;
            }
            stats.Save();
        }
        else
        {
            const string sql = "INSERT INTO INDEXSTATS (DOCUMENTID, SEARCHINDEX, IDENTIFIER, CUSTOMERHITCOUNT, EMPLOYEEHITCOUNT, TOTALCOUNT, LASTHITDATE, DBID) VALUES (?,?,?,?,?,?,?,?)";
            var service = Sage.Platform.Application.ApplicationContext.Current.Services.Get<IDataService>();
            using (var conn = service.GetOpenConnection())
            using (var cmd = conn.CreateCommand(sql))
            {
                if (cmd != null)
                {
                    cmd.Parameters.Clear();
                    cmd.Parameters.Add(cmd.CreateParameter("@DOCUMENTID", items[0]));
                    cmd.Parameters.Add(cmd.CreateParameter("@SEARCHINDEX", items[1]));
                    cmd.Parameters.Add(cmd.CreateParameter("@IDENTIFIER", items[2]));
                    if (_userType == 0)
                    {
                        cmd.Parameters.Add(cmd.CreateParameter("@CUSTOMERHITCOUNT", 1));
                        cmd.Parameters.Add(cmd.CreateParameter("@EMPLOYEEHITCOUNT", 0));
                    }
                    else
                    {
                        cmd.Parameters.Add(cmd.CreateParameter("@CUSTOMERHITCOUNT", 0));
                        cmd.Parameters.Add(cmd.CreateParameter("@EMPLOYEEHITCOUNT", 1));
                    }
                    cmd.Parameters.Add(cmd.CreateParameter("@TOTALCOUNT", 1));
                    cmd.Parameters.Add(cmd.CreateParameter("@LASTHITDATE", DateTime.Now.ToUniversalTime()));
                    cmd.Parameters.Add(cmd.CreateParameter("@DBID", items[3]));
                    cmd.ExecuteNonQuery();
                }
            }
        }
    }

    private void LoadIndexes()
    {
        if ((_indexes == null) || (_indexes.Count == 0))
        {
            var rep = EntityFactory.GetRepository<IIndexDefinition>();
            var qry = (IQueryable)rep;
            var ef = qry.GetExpressionFactory();
            var crit = qry.CreateCriteria();
            var accessExp = ef.Le("UserAccess", _userType);
            crit.Add(ef.And(accessExp, ef.Eq("Enabled", true)));
            crit.AddOrder(ef.Asc("IndexName"));
            var tempIndexes = crit.List<IIndexDefinition>();

            var interfaceAsm = Assembly.GetAssembly(typeof(IIndexDefinition));
            var types = interfaceAsm.GetTypes();
            _tablesEntities = new Dictionary<string, Type>();
            foreach (var entity in types)
            {
                var attrs = TypeDescriptor.GetAttributes(entity);
                foreach (var activeRecord in Enumerable.OfType<ActiveRecordAttribute>(attrs))
                {
                    _tablesEntities.Add(activeRecord.Table.ToUpper(), entity);
                }
            }
            _indexes = new List<IIndexDefinition>();
            foreach (var index in tempIndexes)
            {
                if (index.Type == 1) // database index
                {
                    var dbid = DBIndexDefinition.SetFromString(index.MetaData);
                    if (_tablesEntities.ContainsKey(dbid.MainTable.ToUpper()))
                    {
                        _indexes.Add(index);
                    }
                }
                else
                {
                    _indexes.Add(index);
                }
            }
        }
    }

    private string GetEntityDisplay(Type entity, string value, string displayName = "")
    {
        var okToDisplay = true;
        var displayValue = string.Empty;
        var result = (EntityBase)EntityFactory.GetById(entity, value);

        if ((_userType == 0) && ((entity.Name.Equals("Ticket")) || (entity.Name.Equals("ITicket"))))
        {
            var notifRep = EntityFactory.GetRepository(entity);
            var qry = (IQueryable)notifRep;
            var ef = qry.GetExpressionFactory();
            var crit = qry.CreateCriteria().Add(ef.Eq("Id", value));
            var portalUser = ((IWebPortalUserService)UserService).GetPortalUser().Contact.Account.Id.ToString();
            crit.CreateAlias("Account", "A").Add(ef.Eq("A.Id", portalUser));
            var results = crit.List<EntityBase>();
            okToDisplay = (results.Count > 0);
            if (okToDisplay)
            {
                result = results[0];
            }
            else if (!string.IsNullOrEmpty(displayName))
            {
                var pos = displayName.IndexOf('#');
                displayValue = displayName.Substring(pos + 1, displayName.Length - (13 + pos));
            }
        }
        if (!okToDisplay)
        {
            _displayLink = false;
            return string.Format(GetLocalResourceObject("SpeedSearch_Result_NoLongerExists").ToString(), entity.Name.Substring(1).ToUpper(), displayValue);
        }
        _displayLink = true;
        return String.Format("<b>{0}</b>: {1}", GetEntityDisplayName(entity), result);
    }

    private static string GetEntityDisplayName(Type entity)
    {
        var displayName = entity.GetDisplayName();
        return !string.IsNullOrEmpty(displayName) ? displayName : (entity.IsInterface ? entity.Name.Substring(1) : entity.Name).ToUpper();
    }

    private Type GetEntityFromTable(string table)
    {
        var key = table.ToUpper();
        return _tablesEntities.ContainsKey(key) ? _tablesEntities[key] : null;
    }

    protected void SearchResultsGrid_PageIndexChanged(object source, EventArgs e)
    {
        MarkUsedInfo.Value = string.Empty;
        var index = int.Parse(CurrentPageIndex.Value);
        var end = (index + 1) * 10;
        _totalDocCount = int.Parse(TotalCount.Value);
        var id = ((ImageButton)source).ID;
        if (id.Equals("NextPage"))
        {
            if (end < _totalDocCount)
            {
                index++;
            }
        }
        else if (id.Equals("PreviousPage"))
        {
            if (index > 0)
            {
                index--;
            }
        }
        else if (id.Equals("LastPage"))
        {
            var temp = int.Parse(TotalCount.Value);
            index = temp / 10;
            if ((index * 10) == temp)
            {
                index--;
            }
        }
        else { index = 0; }
        CurrentPageIndex.Value = index.ToString();
        _whichResultsPage = index;

        DoSearch();
        ShowPage();
    }

    protected void SpeedSearchReset_Click(object sender, ImageClickEventArgs e)
    {
        _state = new SpeedSearchState();
        for (var i = 0; i < _indexes.Count; i++)
        {
            _state.SelectedIndexes.Add(i);
        }
        if (!_context.IsConfigurationTypeRegistered(typeof(SpeedSearchState)))
        {
            _context.RegisterConfigurationType(typeof(SpeedSearchState));
        }
        _context.WriteConfiguration(_state);
    }

    protected void NextPage_Click(object sender, ImageClickEventArgs e)
    {

    }

    #region ISmartPartInfoProvider Members

    public ISmartPartInfo GetSmartPartInfo(Type smartPartInfoType)
    {
        var tinfo = new ToolsSmartPartInfo();
        foreach (Control c in SpeedSearch_RTools.Controls)
        {
            tinfo.RightTools.Add(c);
        }
        return tinfo;
    }

    #endregion
}