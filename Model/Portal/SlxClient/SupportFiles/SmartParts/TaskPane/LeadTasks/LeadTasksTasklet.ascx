<div data-dojo-type="Sage.TaskPane.LeadTasksTasklet" id="leadTasks"></div>

<script type="text/javascript">
    var leadTasksActions;
    require(['Sage/TaskPane/LeadTasksTasklet', 'dojo/ready'],
           function (LeadTasksTasklet, ready) {
               ready(function () {
                   if (!leadTasksActions) {
                       leadTasksActions = new LeadTasksTasklet({
                           id: "leadTasksActions",
                           clientId: "<%= ClientID %>"
                       });
                   }
               });
           }
       );
</script>