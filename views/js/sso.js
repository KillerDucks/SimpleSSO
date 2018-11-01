$(() => {
    // Public Encryption Key
    const pubKey = "\
        -----BEGIN PUBLIC KEY-----\
        MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCp6c87R4SfHtiG8t5WN/dtJ7ef\
        UYOaCOP8W4X83jJsdXF2K0QiDHJs2ymy3STtgcxWtZddfKh0gs3RtL+/KC24C33e\
        9FzzGw+bib7+rhE+orvbgTvEmvHuodBWLiyDB2vAdzwIPChskG1oSu5wejUxCR9a\
        LQKuYV1LK2CmfztSowIDAQAB\
        -----END PUBLIC KEY-----"

    // Connect to WS Broker/Server
    const ws = new WebSocket('ws://localhost:9090');
      ws.onmessage = function (event) {
        console.log(event.data);
        // Decode Message
        let m = JSON.parse(event.data);
        switch (m.Type) {
            case "Message":
                // Get Message
                alert(`Info: ${m.Payload.Data.Message}`);
                break;
            case "Authorized":
                // Tell the parent page we are good to go.
                window.postMessage(JSON.stringify({Timestamp: Date.now(), Type: "Credentials200", Security: {Enabled: false, Type: undefined, SecurityCode: 0x00}, Payload: {Data: {Username: m.Payload.Data.Username}, Checksum: undefined}}), "*");
            default:
                break;
        }
    };

    // Get Parameters
    var url = new URL(window.location.href);
    var c = url.searchParams.get("c");
    let p = url.search.slice(1, url.search.length);
    p = p.split("&");
    let tObj = [];
    // Store in a Array
    for (const key in p) {
        let t = {}
        t.Key = p[key].split('=')[0];
        t.Value = p[key].split('=')[1];
        tObj.push(t);
    }
    // Build Data Object
    let query = {};
    tObj.forEach((e) => {
        switch(e.Key){
            case "clientID":
                query.ClientID = e.Value
                break;
            case "clientName":
                query.ClientService = e.Value
                break;
            case "type":
                query.Type = e.Value
                break;
            case "scope":
                query.Scope = e.Value
                break;
        }
    });

    // Debug
    // console.log(url.search);
    // console.log(tObj);
    console.log(query);

    // Change ClientTag
    $("#ClientTag").text(`${query.ClientService} wants to authorize with you.`);

    // Button Handler
    $("#submitBtn").click(() => {
        // Check if form has been filled
        if($("#username").val() == ""){
            alert("You have not entered a username!");
            return;
        }
        if($("#password").val() == ""){
            alert("You have not entered a username!");
            return;
        }
        // Encrypt the credentials
        var encrypt = new JSEncrypt();
        encrypt.setPublicKey(pubKey);
        var encrypted = encrypt.encrypt($("#username").val());        
        // Create Credentials Object
        let c = {
            Username: $("#username").val(),
            Password: $("#password").val()
        };
        // Encrypt the Credentials Object
        c = encrypt.encrypt(JSON.stringify(c));
        let cSHA252 = undefined; // Sort out some kind of checksum later on
        // Create Data Object
        let o = {
            Timestamp: Date.now(),
            Type: "Credentials",
            Security: {
                Enabled: true,
                Type: "RSA Encrypted",
                SecurityCode: 0x001
            },
            Payload: {
                Data: c,
                Checksum: undefined
            }
        };
        // console.log(encrypted)
        // Send Data to API
        ws.send(JSON.stringify(o));
    });
});