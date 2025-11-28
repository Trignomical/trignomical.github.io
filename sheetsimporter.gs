function doPost(e) {
    const sheet = SpreadsheetApp.openById("1h8HvObM2PIueJWpWoApUdswMeHrUy9BOURrAz4838DI").getSheetByName("Sheet1");
    const data = JSON.parse(e.postData.contents);

    const timestamp = new Date().toISOString();
    const row = [timestamp, ...data.reactionTimes, data.averageTime, data.musicBPM];

    sheet.appendRow(row);

    return ContentService
        .createTextOutput("Success")
        .setMimeType(ContentService.MimeType.TEXT);
}

function doGet() {
    return ContentService
        .createTextOutput("Web app is running")
        .setMimeType(ContentService.MimeType.TEXT);
}
