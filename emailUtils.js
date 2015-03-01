/**
 * @namespace emailTools
 */
var emailUtils = (function() {
  
  function getDataFromGmailQuery(options) {
    var attachments;
    var validAttachments;
    
    try {
      attachments = getAttachmentsFromQuery(options.query || "").reduce(function(a, b) {
        return a.concat(b)
      });
    } catch(error) {
      Logger.log(
        "rUtil.emailTools.getDataFromGmailQuery() " 
        + "line 10 - no attachments returned from gmail"
      );
      return;
    };
    
    // Filter out any empty attachments
    validAttachments = attachments.filter(function(attachment) {
      return attachment;
    });
    
    return validAttachments.map(function(attachment) {
      var file = insertExcel(attachment[0]);
      var data = SpreadsheetApp.openById(file.id).getDataRange().getValues();
      Drive.Files.remove(file.id)
      return data;
    });
  }
  
  function getAttachmentsFromQuery(query) {
    return attachments = GmailApp.search(query).map(function(thread) {
      return thread.getMessages().map(function(message) {
        return message.getAttachments();
      });
    });
  }
  
  function insertExcel(attachment) {
    return Drive.Files.insert({title: attachment.getName()}, attachment, {convert: true});
  }
  
  return {
    getDataFromGmailQuery: getDataFromGmailQuery
  };
  
} ());
