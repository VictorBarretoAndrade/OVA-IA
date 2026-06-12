$(document).ready(function () {
    // Dynamically retrieve the iframe object from the DOM
    const iframe = $("#iframe");
    // Get the link of the OVA selected by the user
    const ova_link = localStorage.getItem("ova_link");
    // Set the source of the iframe
    iframe.attr("src", `./ovas/${ova_link}`);
    // This function executes when the iframe load is complete
    iframe.on("load", function() {
        const contentWindow = iframe.get(0).contentWindow;
        const iframeDoc = iframe.contents()[0];
        const frag = iframeDoc.createDocumentFragment();

        const body = iframeDoc.body;
        
        /*
            Dynamically adds the script for detecting interactions
            at the bottom of the OVA HTML
        */
        if (body.querySelector("#ova-script") == undefined) {
            const ovaScript = iframeDoc.createElement("script");
            ovaScript.src = "../../js/ova.js";
            ovaScript.id = "ova-script";
            ovaScript.type = "module";
            frag.appendChild(ovaScript);
            body.appendChild(frag);
        }

        /*
        BUGFIX (B3) / MELHORIA (4.1): the legacy video-player.js injection was
        removed. It mixed seconds with percentages in its checkpoint logic and
        only supported hardcoded YouTube iframes. Media is now rendered by
        ova.js from the database, using the dedicated player components in
        js/components/ (video-player.js and audio-player.js), which accept any
        URL and track consumption per resource.
        */

        // Attach a scroll event listener to the content window
        $(contentWindow).on("scroll", function () {
            const s = $(contentWindow).scrollTop(),
                d = $(iframeDoc).height(),
                c = $(contentWindow).height();
    
            // Calculate scroll percentage
            const scrollPercent = (s / (d - c)) * 100;    
            
            // Update the progress bar
            $("#progressbar").attr('value', scrollPercent);
        });
    });

    // Get the DOM elements for the dropdown
    const dropdown = $(".dropdown");
    dropdown.css({"top": "-600px"});
    const dropdownButton = $(".dropdown-button");

    /*
    When the dropdown button is clicked, shows the logout button
    and the button to the student plot page
    */
    dropdownButton.on("click", function() {
        if (!dropdownButton.hasClass("bi-x-lg")) {
            dropdown.removeClass("z-n1").addClass("z-1");
            dropdown.animate({
                top: "50px"
            }, 250);
            dropdownButton.addClass("bi-x-lg");
        } else {
            dropdown.animate({
                top: "-600px"
            }, 250);
            dropdownButton.removeClass("bi-x-lg");
        }
    });
});

// NOTE: a duplicated, unused copy of generateScrollPoints lived here reading
// the old GLOBAL perc_scrolled key (see BUGFIX B4). It was dead code in this
// file (only ova.js uses scroll points) and was removed.
