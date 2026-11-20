import { db, authReady } from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";


// HTML elements
var eventContainer = document.getElementById("eventContainer");
var searchInput = document.getElementById("searchInput");

var registrationForm = document.getElementById("registrationForm");
var studentName = document.getElementById("studentName");
var studentEmail = document.getElementById("studentEmail");
var selectedEvent = document.getElementById("selectedEvent");
var formMessage = document.getElementById("formMessage");

var attendeesList = document.getElementById("attendeesList");


// Store data
var events = [];
var registrations = [];


// Create attendee search box
var attendeeSearch = document.createElement("input");

attendeeSearch.type = "text";
attendeeSearch.placeholder = "Search attendees by name or email...";
attendeeSearch.id = "attendeeSearch";

var attendeesTable = attendeesList.closest("table");

attendeesTable.parentNode.insertBefore(attendeeSearch, attendeesTable);


// Display events
function displayEvents(eventList) {

    eventContainer.innerHTML = "";

    if (eventList.length === 0) {
        eventContainer.textContent = "No events found.";
        return;
    }

    eventList.forEach(function(event) {

        var card = document.createElement("div");
        card.className = "event-card";

        card.innerHTML = `
            <h3>${event.Name}</h3>
            <p>Category: ${event.Category}</p>
            <p>Date: ${event.Date}</p>
            <p>Venue: ${event.Venue}</p>
            <p>Available Seats: ${event.Seats}</p>
            <button type="button">Register Now</button>
        `;

        var button = card.querySelector("button");

        button.onclick = function() {
            selectedEvent.value = event.Name;
            document.getElementById("register").scrollIntoView();
        };

        eventContainer.appendChild(card);

    });

}


// Load events from Firebase
async function loadEvents() {

    try {

        var result = await getDocs(collection(db, "events"));

        events = [];

        result.forEach(function(firebaseDocument) {

            events.push({
                id: firebaseDocument.id,
                ...firebaseDocument.data()
            });

        });

        displayEvents(events);

        selectedEvent.innerHTML = '<option value="">Select an Event</option>';

        events.forEach(function(event) {

            var option = document.createElement("option");

            option.value = event.Name;
            option.textContent = event.Name;

            selectedEvent.appendChild(option);

        });

    } catch (error) {

        console.log("Error loading events:", error);
        eventContainer.textContent = "Unable to load events.";

    }

}


// Search events
searchInput.addEventListener("input", function() {

    var searchText = searchInput.value.toLowerCase();

    var filteredEvents = events.filter(function(event) {

        return event.Name.toLowerCase().includes(searchText);

    });

    displayEvents(filteredEvents);

});


// Register a student
registrationForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    var name = studentName.value.trim();
    var email = studentEmail.value.trim().toLowerCase();
    var eventName = selectedEvent.value;

    if (name === "" || email === "" || eventName === "") {
        formMessage.textContent = "Please fill all the fields.";
        return;
    }

    try {

        // Check existing registrations
        var result = await getDocs(collection(db, "registration"));

        var alreadyRegistered = false;

        result.forEach(function(firebaseDocument) {

            var registration = firebaseDocument.data();

            if (
                registration.studentEmail.toLowerCase() === email &&
                registration.eventName === eventName
            ) {
                alreadyRegistered = true;
            }

        });

        if (alreadyRegistered) {
            formMessage.textContent = "You are already registered!";
            return;
        }

        // Generate registration ID
        var registrationId = "REG" + Date.now();

        // Save registration
        await addDoc(collection(db, "registration"), {

            studentName: name,
            studentEmail: email,
            eventName: eventName,
            registrationId: registrationId

        });

        formMessage.textContent = "Registration successful!";

        registrationForm.reset();

        await displayAttendees();

    } catch (error) {

        console.log("Registration error:", error);
        formMessage.textContent = "Registration failed. Please try again.";

    }

});


// Display all registrations
async function displayAttendees() {

    try {

        var result = await getDocs(collection(db, "registration"));

        registrations = [];

        result.forEach(function(firebaseDocument) {

            registrations.push({
                id: firebaseDocument.id,
                ...firebaseDocument.data()
            });

        });

        showAttendees(registrations);

    } catch (error) {

        console.log("Error loading registrations:", error);

        attendeesList.innerHTML =
            '<tr><td colspan="5">Unable to load registrations.</td></tr>';

    }

}


// Show attendees in table
function showAttendees(list) {

    attendeesList.innerHTML = "";

    if (list.length === 0) {

        attendeesList.innerHTML =
            '<tr><td colspan="5">No registrations found.</td></tr>';

        return;
    }

    list.forEach(function(registration) {

        var row = document.createElement("tr");

        var idCell = document.createElement("td");
        var nameCell = document.createElement("td");
        var emailCell = document.createElement("td");
        var eventCell = document.createElement("td");
        var actionCell = document.createElement("td");

        idCell.textContent = registration.registrationId;
        nameCell.textContent = registration.studentName;
        emailCell.textContent = registration.studentEmail;
        eventCell.textContent = registration.eventName;

        // Edit button
        var editButton = document.createElement("button");

        editButton.textContent = "Edit";
        editButton.type = "button";

        editButton.onclick = function() {
            editRegistration(registration.id);
        };

        // Delete button
        var deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";
        deleteButton.type = "button";

        deleteButton.onclick = function() {
            deleteRegistration(registration.id);
        };

        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);

        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(emailCell);
        row.appendChild(eventCell);
        row.appendChild(actionCell);

        attendeesList.appendChild(row);

    });

}


// Search attendees
attendeeSearch.addEventListener("input", function() {

    var searchText = attendeeSearch.value.toLowerCase();

    var filteredRegistrations = registrations.filter(function(registration) {

        return (
            registration.studentName.toLowerCase().includes(searchText) ||
            registration.studentEmail.toLowerCase().includes(searchText)
        );

    });

    showAttendees(filteredRegistrations);

});


// Edit registration
async function editRegistration(id) {

    var registration = registrations.find(function(item) {
        return item.id === id;
    });

    if (!registration) {
        return;
    }

    var newName = prompt("Enter updated student name:", registration.studentName);

    if (newName === null) {
        return;
    }

    var newEmail = prompt("Enter updated email:", registration.studentEmail);

    if (newEmail === null) {
        return;
    }

    var newEvent = prompt(
        "Enter event name:\n" + events.map(function(item) {
            return item.Name;
        }).join(", "),
        registration.eventName
    );

    if (newEvent === null) {
        return;
    }

    newName = newName.trim();
    newEmail = newEmail.trim().toLowerCase();
    newEvent = newEvent.trim();

    if (newName === "" || newEmail === "" || newEvent === "") {
        alert("All fields are required.");
        return;
    }

    if (!events.some(function(item) {
        return item.Name === newEvent;
    })) {
        alert("Please enter a valid event name.");
        return;
    }

    try {

        // Prevent duplicate registration
        var duplicate = registrations.some(function(item) {

            return (
                item.id !== id &&
                item.studentEmail.toLowerCase() === newEmail &&
                item.eventName === newEvent
            );

        });

        if (duplicate) {
            alert("This student is already registered for this event.");
            return;
        }

        // Update Firebase record
        await updateDoc(doc(db, "registration", id), {

            studentName: newName,
            studentEmail: newEmail,
            eventName: newEvent

        });

        alert("Registration updated successfully!");

        await displayAttendees();

    } catch (error) {

        console.log("Update error:", error);
        alert("Unable to update registration. Check Firestore Rules.");

    }

}


// Delete registration
async function deleteRegistration(id) {

    var confirmDelete = confirm("Are you sure you want to delete this registration?");

    if (!confirmDelete) {
        return;
    }

    try {

        await deleteDoc(doc(db, "registration", id));

        alert("Registration deleted successfully!");

        await displayAttendees();

    } catch (error) {

        console.log("Delete error:", error);
        alert("Unable to delete registration.");

    }

}


// Start website after Firebase login
async function startWebsite() {

    try {

        await authReady;

        await loadEvents();

        await displayAttendees();

    } catch (error) {

        console.log("Firebase login error:", error);

    }

}

startWebsite();