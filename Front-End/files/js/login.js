import { 
    login, 
    getCourseOVAs, 
} from "./request.js";

import { makeCourseOVAs } from "./make.js";

$(document).ready(function() {
    const loginTab = $("#login"); // Select the login tab element
    const chooseOVAsTab = $("#choose-ova"); // Select the OVA selection tab element
    const ovaDiv = $(".ova-div"); // Select the OVA div element
    const logoutButton = $(".logout-button"); // Select the logout button element

    const is_admin = JSON.parse(localStorage.getItem("is_admin")); // Retrieve admin status from local storage

    /*
    If the previous page was the plot page, show the page to choose the OVA
    Otherwise, go to the login page, indicating that the user is not logged in or has logged out
    */
    if (sessionStorage.getItem("past_page") == "plot") {
        if (is_admin == true) {
            localStorage.clear(); // Clear local storage for admin
            localStorage.setItem("logged", false); // Set logged status to false
            loginTab.removeClass("d-none"); // Show login tab
            chooseOVAsTab.addClass("d-none"); // Hide OVA selection tab
        } else {
            chooseOVAsTab.addClass("d-none"); // Hide OVA selection tab
            loginTab.removeClass("d-none"); // Show login tab
        }
    } else {
        localStorage.clear(); // Clear local storage if not returning from the plot page
        localStorage.setItem("logged", false); // Set logged status to false
    }

    // Define the variables for input elements and buttons
    const togglePassword = $(".toggle-password"); // Select the toggle password button
    const raInput = $("#ra-input"); // Select the RA input field
    const passwordInput = $("#password-input"); // Select the password input field
    const loginButton = $(".login-button"); // Select the login button

    // This function toggles the visibility of the password
    togglePassword.on("click", function() {
        if (!togglePassword.hasClass("bi-eye-slash-fill")) {
            passwordInput.attr("type", "text"); // Show password
            togglePassword.addClass("bi-eye-slash-fill"); // Change icon to 'visible'
        } else {
            passwordInput.attr("type", "password"); // Hide password
            togglePassword.removeClass("bi-eye-slash-fill"); // Change icon to 'hidden'
        }
    });

    loginButton.on("click", async function(e) {
        const statusBar = $(".login-form").find(".status-bar"); // Select the status bar
        e.preventDefault(); // Prevent default form submission
        // Get the form data for the request
        const user_data = {
            ra: raInput.val(), // Retrieve RA input value
            password: passwordInput.val() // Retrieve password input value
        };
        // Send the login data to the API for validation
        await login(user_data)
        .then(response => {
            /*
            If the request is successful, proceed to the next page
            */
            statusBar.html(response.Message); // Display response message
            statusBar.removeClass("bg-danger"); // Remove error styling
            statusBarAnimation(statusBar); // Animate the status bar
            // Clear the input fields
            raInput.val("");
            passwordInput.val("");
            // Store the received information in local storage
            localStorage.setItem("logged", true); // Set logged status to true
            localStorage.setItem("is_admin", response.is_admin); // Store admin status
            localStorage.setItem("course_id", response.ids.course_id); // Store course ID
            localStorage.setItem("student_id", response.ids.student_id); // Store student ID
            // MELHORIA (4.2): session token sent as Bearer header by request.js
            localStorage.setItem("token", response.token);

            // If the user logged in successfully
            const isAdmin = JSON.parse(localStorage.getItem("is_admin")); // Get admin status
            if (JSON.parse(localStorage.getItem("logged")) === true) {
                setTimeout(async function() {
                    
                    // If the user is admin, redirect to the administrator's plot page
                    // Define the window's HTML link
                    if (isAdmin == true) window.location.href = "plots.html"; // Redirect to admin plots
                    else {
                        // Otherwise, redirect to the OVA selection page
                        loginTab.addClass("d-none"); // Hide login tab
                        chooseOVAsTab.removeClass("d-none"); // Show OVA selection tab

                        // Get the OVAs of the student's course for selection
                        getCourseOVAs(localStorage.getItem("course_id"))
                        .then(response => makeCourseOVAs(response, ovaDiv))
                        .catch(error => console.log(error)); // Log any errors
                    }
                }, 500); // Delay before redirecting
            }
        }).catch(error => {
            // If the request returns an error, display it in a red status bar
            statusBar.html(error.responseText); // Show error message
            statusBar.addClass("bg-danger"); // Add error styling
            statusBarAnimation(statusBar); // Animate the status bar
        });
    });

    // Logout the user and return to the login page
    logoutButton.on("click", function() {
        loginTab.removeClass("d-none"); // Show login tab
        chooseOVAsTab.addClass("d-none"); // Hide OVA selection tab
        // Define the past page as the OVA selection page
        sessionStorage.setItem("past_page", "choose-ova");
    });
});

// Animation for the error/success status bar
function statusBarAnimation(statusBar) {
    statusBar.animate({
        top: "37px" // Animate the status bar to show
    }, 100);
    setTimeout(function() {
        statusBar.animate({
            top: "5px" // Animate the status bar back to the top
        }, 100);
    }, 1000); // Delay before resetting the position
}
