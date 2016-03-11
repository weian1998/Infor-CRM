<div data-dojo-type="Sage.TaskPane.OpportunityTasksTasklet" id="opportunityTasks"></div>

<script type="text/javascript">
    var opportunityTasksActions;
    require(['Sage/TaskPane/OpportunityTasksTasklet', 'dojo/ready'],
        function (OpportunityTasksTasklet, ready) {
            ready(function () {
                if (!opportunityTasksActions) {
                    opportunityTasksActions = new OpportunityTasksTasklet({
                        id: "opportunityTasksActions",
                        clientId: "<%= ClientID %>"
                    });
                }
            });
        }
    );
</script>