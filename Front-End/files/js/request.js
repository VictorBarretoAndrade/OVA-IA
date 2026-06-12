// Base parameters to make the API request
const PORT = 5010;
const HOST = window.location.hostname || "localhost";
const BASE_URL = `http://${HOST}:${PORT}`;

// MELHORIA (4.2): the session token issued by POST /login is stored in
// localStorage and sent as a Bearer header on every request, so protected
// endpoints (/progress/*, /student/me, /edubot/*) know who is logged in.
function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
}

// Send the request to the API using a Promise, due to the async functionality
export function doRequest(url, data, type="POST", is_login=0) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: type,
            url: BASE_URL + url,
            data: JSON.stringify([data]),
            dataType: "json",
            crossDomain: true,
            contentType: "application/json",
            headers: authHeaders(),
            success: (response) => resolve(response),
            error: (response) => reject(response)
        });
    });
}

// Base function to register any interaction in the OVA
export function registerInteraction(interaction) {
    const url = "/interaction/register";
    const data = {
        student_id: localStorage.getItem("student_id"),
        ova_id: localStorage.getItem("ova_id"),
        // competency_id: localStorage.getItem("competency_id"),
        action: interaction
    }
    return doRequest(url, data);
}

// Calls the request function with the parameters for login
export function login(user_data) {
    const url = "/login"; // Define the login URL
    return doRequest(url, user_data, "POST", true); // Send the login request
}

// Calls the request function with the parameters to get the OVAs of a course
export function getCourseOVAs(course_id) {
    return doRequest(`/ova/course/${course_id}`, {}, "GET"); // Send request to get OVAs
}

/* 
Calls the request function with the parameters to get all the questions 
of an OVA
*/
export function getOVAQuestions() {
    const data = {
        ova_id: localStorage.getItem("ova_id"),
        student_id: localStorage.getItem("student_id")
    };
    return doRequest(`/question/ova`, data, 'POST');
}

// Calls the request function with the parameters to get all courses
export function getCourses() {
    const url = "/courses";
    return doRequest(url, {}, "GET");
}

// Calls the request function with the parameters to get all the OVAs
export function getSubjectOVAs(subject_id) {
    const url = `/ova/subject/${subject_id}`;
    return doRequest(url, {}, "GET");
}

// Calls the request function with the parameters to get all the course subjects
export function getCourseSubjects(course_id) {
    const url = `/course/${course_id}/subjects`;
    return doRequest(url, {}, "GET");
}

// Calls the request function with the parameters to get the student plot
export function getStudentPlot(data) {
    const url = `/plot/student`; // Defining the endpoint URL for student plot.
    return doRequest(url, data, "POST"); // Making a POST request to retrieve the student plot data.
}

// Calls the request function with the parameters to get the course plot
export function getCoursePlot(data) {
    const url = "/plot/course"; // Defining the endpoint URL for course plot.
    return doRequest(url, data, "POST"); // Making a POST request to retrieve the course plot data.
}

// Calls the request function with the parameters to get the OVA plot
export function getOVAPlot(data) {
    const url = "/plot/ova"; // Defining the endpoint URL for OVA plot.
    return doRequest(url, data, "POST"); // Making a POST request to retrieve the OVA plot data.
}

// Calls the request function with the parameters to get the students of a course
export function getStudentsByCourse(course_id) {
    const url = `/student/course/${course_id}`; // Defining the endpoint URL for fetching students of a specific course.
    return doRequest(url, {}, "GET"); // Making a GET request to retrieve the list of students in the course.
}

export function getStudentInteractionsNum(data) {
    const url = "/plot/interaction/ova" // Defining the endpoint URL for fetching student interactions for a specific OVA.
    return doRequest(url, data, "POST") // Making a POST request to retrieve the student interactions data.
}

// ---------------------------------------------------------------------------
// MELHORIA (4.1): resources of an OVA + persistence of consumption tracking
// ---------------------------------------------------------------------------

// Resources (texto/video/podcast/quiz/atividade) of an OVA with the logged
// student's progress on each one
export function getOVAResources(ova_id) {
    return doRequest(`/ova/${ova_id}/resources`, {}, "GET");
}

// Persists read_time / perc_scrolled / completed of the current OVA
export function saveOVAProgress(data) {
    return doRequest("/progress/ova", data, "POST");
}

// Persists consumption of a single resource (video %, podcast seconds, ...)
export function saveResourceProgress(data) {
    return doRequest("/progress/resource", data, "POST");
}

// ---------------------------------------------------------------------------
// MELHORIA (4.2/4.3): student context + EduBot agent
// ---------------------------------------------------------------------------

// Full profile of the logged student (consumption, competencies, history)
export function getMe() {
    return doRequest("/student/me", {}, "GET");
}

// Asks the EduBot agent for a fresh recommendation for the logged student
export function getEdubotRecommendation() {
    return doRequest("/edubot/recommendation", {}, "GET");
}

/*
Calls the request function with the parameters to get all the questions 
of an OVA along with the answers given by the student.
*/
export function answerQuestion(data) {
    return doRequest(`/question/answer`, data, 'POST');
}

// Calls the request function with the parameters to get all the competencies
/*
export function getAllCompetencies() {
    const url = "/competency";
    return doRequest(url, {}, "GET");
}
*/
