	var AddressCountryCfg = null;
	function showAddressDialog(){
		loadAddressControlConfig();
		var controls = $(".address-control");
		var bInsert;
		window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str,key,value) {	
			if( key == 'modeid' && value == 'Insert')
				bInsert = true;
		});
		for(i=0; i < controls.length; i++){
			var controlId = controls[i].id;
			var address = dijit.byId(controlId);
			if(address){
				var a = address.fields[8];
				address.fields[8] = address.fields[10];
				address.fields[10] = a;
				if(bInsert){
				    require(["Sage/Data/SDataServiceRegistry"], function(sDataServiceRegistry){
						var request = new Sage.SData.Client.SDataSingleResourceRequest(sDataServiceRegistry.getSDataService('dynamic'))
						request.setResourceKind("CustomSettings");
						request.setQueryArg("where", "Category eq 'blackpoint' and Description eq 'AddressCountryDefault'");
						request.read({
							success: function(setting){ 
								address.fields[12].value = setting.DataValue;
							}
						});
					});
				}
				dojo.connect(address, "showDialog", function(e){
					dojo.connect(dijit.byId( this.id +  "-postalCode"),'onChange', function(e){ updateAddress(this.id, e);});
				});
			}
		}
	}
		
	function loadAddressControlConfig(){
		if(AddressCountryCfg == null){
			require(["Sage/Data/SDataServiceRegistry"], function(sDataServiceRegistry){
				var request = new Sage.SData.Client.SDataResourceCollectionRequest(sDataServiceRegistry.getSDataService('dynamic'))
				request.setResourceKind("CustomSettings");
				request.setQueryArg("where", "Category eq 'blackpoint' and Description like 'AddressCountry%'");
				request.read({
					success: function(feed){ 
						if(feed)
						{
							AddressCountryCfg = {};
							for(var i = 0; i < feed. $resources.length; i++){
								var entry = feed.$resources[i];
								if(entry.Description == "AddressCountryDefault")
									AddressCountryCfg.Default = entry.DataValue;
								if(entry.Description.startsWith('AddressCountryDisplay') && entry.DataValue)
									AddressCountryCfg[entry.Description.split('_')[1]] = entry.DataValue;
							}
						}
					}
				});
			});
		}
	}
	
	function updateAddress(controlId, postalCode){
		controlId = controlId.replace("-postalCode", "");
		var country = dijit.byId(controlId +  "-country").comboBox.value.trim();
		country = AddressCountryCfg[country];
		if( country && postalCode.trim() != ""){
			require(["Sage/Data/SDataServiceRegistry"], function(sDataServiceRegistry){
				var request = new Sage.SData.Client.SDataResourceCollectionRequest(sDataServiceRegistry.getSDataService('dynamic'));
				//var request = new Sage.SData.Client.SDataSingleResourceRequest(sDataServiceRegistry.getSDataService('dynamic'))
					request.setResourceKind('PostalCodes');
					request.setQueryArg("where", "Postalcode eq '" + postalCode + "' and Country eq '" + country + "'");
					request.read({
						success: function(feed){ 
							for(var i = 0; i < feed.$resources.length; i++){
								var entry = feed.$resources[i];
								if(i == 0)
								{
									dijit.byId(controlId +  "-state").comboBox.set("value", entry.State);
									dijit.byId(controlId +  "-city").comboBox.set("value", entry.City); 
									dijit.byId(controlId +  "-county").textbox.value = entry.County;
								}
							}
							//if(postalcodes.length > 0){
								//TODO
							//}
						},
						failure: function() {
							//console.warn('could not find postalcode :' + postalcode );
						} 
				});
			})
		}
	}

	
	
	require(["dojo/ready"], function(ready){
		ready(function(){
			window.onload = showAddressDialog;
			var sysApplication = Sys.WebForms.PageRequestManager.getInstance();
			sysApplication.add_endRequest(showAddressDialog);
		});
	});

