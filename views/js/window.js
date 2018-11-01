$(() => {
    var myWindow;

    window.openWin = function() {
        // Get Text box data
        let csn = $("#csn").val();
        let cst = $("#cst").val();
        // Value Checking
        if(csn == ""){
            csn = $("#csn").attr('placeholder');
        }
        if(cst == ""){
            cst = $("#cst").attr('placeholder');
        }

        myWindow = window.open(`/sso.html?clientID=213ads3s3&clientName=${csn}&type=${cst}&scope=user`, "", "width=577, height=335");

        myWindow.addEventListener('message', function(event) {
            let m = JSON.parse(event.data);
            console.log(m);
            if(m.Type == "Credentials200")
            {
                // CLose SSO Login Window
                myWindow.close();
                // Change Page Text
                $('.changeUser').text(`Welcome - ${m.Payload.Data.Username} - Test Complete - Status 200 - Systems: Operational - Deployment: Ready`);                
            }
            // if (event.data === 'identify_me') {
            //     console.log(event.source, 'is saying hello!');
            // }
        });
    }


});