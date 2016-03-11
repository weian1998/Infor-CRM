
var EmailTicket = function(contactEmail, assignedToEmail, acctMgrEmail, myMgrEmail, emailSubject, emailBody) {
    this.contactEmail = contactEmail;
    this.assignedToEmail = assignedToEmail;
    this.acctMgrEmail = acctMgrEmail;
    this.myMgrEmail = myMgrEmail;
    this.emailSubject = emailSubject;
    this.emailBody = emailBody;
};

function SendTicketEmail(emailType, emailContact, emailAssignedTo, emailAccountMgr, emailMyManager)
{
    var addressTo = "";
    var addressCC = "";
    var emailBody = " ";
    if (document.getElementById(emailContact).checked)
    {
        addressTo += ((this.contactEmail == "") ? "" : this.contactEmail + ";");
        if (document.getElementById(emailAssignedTo).checked)
            addressCC += ((this.assignedToEmail == "") ? "" : this.assignedToEmail + ";");
        if (document.getElementById(emailAccountMgr).checked)
            addressCC += ((this.acctMgrEmail == "") ? "" : this.acctMgrEmail + ";");
        if (document.getElementById(emailMyManager).checked)
            addressCC += ((this.myMgrEmail == "") ? "" : this.myMgrEmail + ";");
    }
    else
    {
        if (document.getElementById(emailAssignedTo).checked)
            addressTo += ((this.assignedToEmail == "") ? "" : this.assignedToEmail + ";");
        if (document.getElementById(emailAccountMgr).checked)
            addressTo += ((this.acctMgrEmail == "") ? "" : this.acctMgrEmail + ";");
        if (document.getElementById(emailMyManager).checked)
            addressTo += ((this.myMgrEmail == "") ? "" : this.myMgrEmail + ";");
    }
    
    var radioList = document.getElementById(emailType);
    var options = radioList.getElementsByTagName('input');
    if (options[0].checked) //Ticket info
    {
        emailBody = this.emailBody;
    }

    var subject = this.emailSubject;
    
    require(['Sage/Utility/Email', 'dojo/_base/array'], function(email, array) {
        var toAddresses = [];
        var ccAddresses = [];   
        if (addressTo !== '') {
            toAddresses = addressTo.split(';');
            array.forEach(toAddresses, function(address, idx) {                
                toAddresses[idx] = decodeURIComponent(address).trim();
            });
        }
        if (addressCC !== '') {
            ccAddresses = addressCC.split(';');
            array.forEach(ccAddresses, function(address, idx) {
                ccAddresses[idx] = decodeURIComponent(address).trim();
            });     
        }
        email.writeEmail(
            {
                to: toAddresses,
                cc: ccAddresses,
                bcc: []
            },
            decodeURIComponent(subject),
            decodeURIComponent(emailBody),
            false, 1);
    });
}

EmailTicket.prototype.SendTicketEmail = SendTicketEmail;   

function sendEmail(emailType, emailContact, emailAssignedTo, emailAccountMgr, emailMyManager)
{
    @emailTicketId.SendTicketEmail(emailType, emailContact, emailAssignedTo, emailAccountMgr, emailMyManager);
}
  