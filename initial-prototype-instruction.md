## Task
Create a userscript that tracks and records a user's current status

## Job Desc

Every time a mutation is detected (use mutation observer), capture `document.querySelectorAll('header')[3].innerText` and store it to tampermonkey's storage along with its timestamp in ISO format

## Features

Add ability to export data to csv. During conversion, convert the timestamp to user's local timestamp. 

## MutationObserver Setup

### Config
    const config = {
        childList: true,  // Observe additions/removals of direct children
        subtree: true,    // Observe changes in descendants as well
        attributes: true, // Observe attribute changes
    };

### Target Desc
The header is located at `document.querySelectorAll('header')[3]`. 

## HTML Sample
The HTML sample is attached below