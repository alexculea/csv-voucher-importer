
const form = document.getElementById('upload');
const fileSelect = document.getElementById('fileselect');
const uploadButton = document.getElementById('uploadBtn');
const statusMessageContainer = document.getElementById('messages');

form.onsubmit = (ev) => {
    ev.preventDefault();

    statusMessageContainer.classList = [];
    statusMessageContainer.innerHTML = '';

    // update UI
    const oldUploadText = uploadButton.innerHTML;
    uploadButton.innerHTML = 'Processing...';
    uploadButton.disabled = true;

    // Get the selected files from the input.
    const files = fileSelect.files;
    // FormData is the specialized API that will encode the files for us
    const formData = window['__formdata'];

    for (const file of files) {
        // Add the file to the request.
        formData.append('csv-files[]', file, file.name);
    }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', form.getAttribute('action'), true);
    // Set up a handler for when the request finishes.
    xhr.onload = function () {
        
        if (xhr.status === 200) {
            statusMessageContainer.innerHTML = 'File(s) processed with success.';
            statusMessageContainer.className = 'success';
        } else {
            statusMessageContainer.innerHTML = xhr.response;
            statusMessageContainer.className = 'error';
        }

        uploadButton.disabled = false;
        uploadButton.innerHTML = oldUploadText;

        // reinitialize formdata
        window['__formdata'] = new FormData();
    };

    // Send the Data.
    xhr.send(formData);
}