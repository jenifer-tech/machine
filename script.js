document.addEventListener('DOMContentLoaded', function() {
    const entryLink = document.getElementById('entry-link');
    const exitLink = document.getElementById('exit-link');
    const entryForm = document.getElementById('entry-form');
    const exitForm = document.getElementById('exit-form');
    const form = document.getElementById('machine-form');
    const dateRangeForm = document.getElementById('date-range-form');
    const recordsTable = document.getElementById('records-table');
    const customAlert = document.getElementById('custom-alert');
    const alertMessage = document.getElementById('alert-message');
    const closeAlertButton = document.getElementById('close-alert');
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const cancelEditButton = document.getElementById('cancel-edit');
    const editRate = document.getElementById('edit_rate');

    let currentEditId = null;
    let currentMachineName = null;

    // Show the entry form and hide the exit form
    entryLink.addEventListener('click', function(event) {
        event.preventDefault();
        entryForm.style.display = 'block';
        exitForm.style.display = 'none';
    });

    // Show the exit form and hide the entry form
    exitLink.addEventListener('click', function(event) {
        event.preventDefault();
        entryForm.style.display = 'none';
        exitForm.style.display = 'block';
        recordsTable.style.display = 'none';
    });

    // Handle the submission of the entry form
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(form);

        fetch('/submit', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            alertMessage.textContent = data.message;
            customAlert.style.display = 'block';
            entryForm.style.display = 'none';
            form.reset();
        })
        .catch(error => console.error('Error:', error));
    });

    // Handle the submission of the date range form
    dateRangeForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(dateRangeForm);

        fetch('/get_records', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const tbody = recordsTable.querySelector('tbody');
            tbody.innerHTML = '';

            data.records.forEach(record => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${record.cus_name}</td>
                    <td>${record.cus_address}</td>
                    <td>${record.cus_phoneno}</td>
                    <td>${record.machine_name}</td>
                    <td>${record.count || ''}</td>
                    <td>${record.out_time}</td>
                    <td>${record.in_time || ''}</td>
                    <td>${record.rate || ''}</td>
                    <td><button class="edit-button" data-id="${record.id}">EDIT</button></td>
                `;
                tbody.appendChild(tr);
            });

            recordsTable.style.display = 'table';

            // Attach event listeners to newly added Edit buttons
            document.querySelectorAll('.edit-button').forEach(button => {
                button.addEventListener('click', function() {
                    currentEditId = this.getAttribute('data-id');
                    const row = this.closest('tr');
                    currentMachineName = row.children[3].textContent;

                    // Populate the edit modal fields
                    document.getElementById('edit_in_time').value = row.children[6].textContent;
                    editRate.value = row.children[7].textContent;

                    // Display the edit modal
                    editModal.style.display = 'block';
                });
            });
        })
        .catch(error => console.error('Error:', error));
    });

    // Handle the submission of the edit form
    editForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(editForm);
        formData.append('id', currentEditId);

        fetch('/edit_record', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alertMessage.textContent = data.error;
            } else {
                const rate = data.rate;

                // Update the rate in the edit form and table
                editRate.value = rate;

                // Set the alert message
                alertMessage.textContent = `Machine "${currentMachineName}" Rent is: ${rate}`;
                
                // Show the custom alert dialog box
                customAlert.style.display = 'block';
                
                // Hide the edit modal
                editModal.style.display = 'none';

                // Refresh the table to reflect changes
                dateRangeForm.submit();
            }
        })
        .catch(error => console.error('Error:', error));
    });

    // Close the custom alert dialog box
    closeAlertButton.addEventListener('click', function() {
        customAlert.style.display = 'none';
    });

    // Cancel editing and close the modal
    cancelEditButton.addEventListener('click', function() {
        editModal.style.display = 'none';
    });
});
