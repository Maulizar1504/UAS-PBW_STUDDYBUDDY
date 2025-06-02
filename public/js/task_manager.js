document.addEventListener('DOMContentLoaded', function() {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const addTaskForm = document.getElementById('addTaskForm');
    const pendingTasksList = document.getElementById('pendingTasksList');
    const completedTasksList = document.getElementById('completedTasksList');
    const editTaskModal = document.getElementById('editTaskModal');
    const closeEditModalBtn = editTaskModal.querySelector('.close-button');
    const editTaskForm = document.getElementById('editTaskForm');
    const editTaskId = document.getElementById('editTaskId');
    const editDescription = document.getElementById('editDescription');
    const editDeadline = document.getElementById('editDeadline');

    // Inisialisasi Select2 untuk dropdown prioritas
    // Pastikan jQuery sudah dimuat sebelum ini
    if (typeof jQuery !== 'undefined') {
        // Function untuk merender opsi di Select2 dengan ikon
        function formatState (state) {
            if (!state.id) {
                return state.text;
            }
            var iconClass = $(state.element).data('icon');
            if (iconClass) {
                return $('<span><i class="' + iconClass + '"></i> ' + state.text + '</span>');
            }
            return state.text;
        };

        $('#priority').select2({
            templateResult: formatState,
            templateSelection: formatState,
            minimumResultsForSearch: Infinity // Hapus search box jika hanya sedikit opsi
        });

        $('#editPriority').select2({
            templateResult: formatState,
            templateSelection: formatState,
            minimumResultsForSearch: Infinity // Hapus search box jika hanya sedikit opsi
        });
    } else {
        console.error("jQuery is not loaded. Select2 initialization skipped.");
    }


    // Helper function to get priority icon and display text for LIST ITEMS
    function getPriorityDetails(priorityValue) {
        let iconClass = '';
        let displayText = '';
        switch (priorityValue) {
            case 'now':
                iconClass = 'fas fa-fire'; // Ikon Api untuk 'Now'
                displayText = 'Now';
                break;
            case 'rush':
                iconClass = 'fas fa-clock'; // Ikon Jam untuk 'Rush'
                displayText = 'Rush';
                break;
            case 'plann':
                iconClass = 'fas fa-brain'; // Ikon Otak untuk 'Plann'
                displayText = 'Plann';
                break;
            default:
                iconClass = 'fas fa-question-circle'; // Fallback icon
                displayText = 'Unknown';
        }
        return { iconClass, displayText };
    }

    // Function to render tasks
    function renderTasks(tasks) {
        pendingTasksList.innerHTML = '';
        completedTasksList.innerHTML = '';

        let hasPendingTasks = false;
        let hasCompletedTasks = false;

        tasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.classList.add('task-item');
            taskItem.dataset.id = task.id;

            if (task.completed) {
                taskItem.classList.add('completed');
                hasCompletedTasks = true;
            } else {
                hasPendingTasks = true;
            }

            const priorityDetails = getPriorityDetails(task.priority);

            taskItem.innerHTML = `
                <i class="task-status-checkbox fas ${task.completed ? 'fa-check-square completed' : 'fa-square'}"></i>
                <div class="task-content">
                    <div class="task-header">
                        <span class="task-description-text">${task.description}</span>
                    </div>
                    <div class="task-details-text">
                        Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString('id-ID') : 'Tidak ada'}
                    </div>
                    <div class="task-priority ${task.priority}">
                        <i class="${priorityDetails.iconClass}"></i>
                        <span>Prioritas: ${priorityDetails.displayText}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="edit-btn" title="Edit Tugas"><i class="fas fa-pencil-alt"></i></button>
                    <button class="delete-btn" title="Hapus Tugas"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;

            const checkbox = taskItem.querySelector('.task-status-checkbox');
            if (checkbox) {
                checkbox.addEventListener('click', () => toggleTaskCompleted(task.id, !task.completed));
            }

            const editBtn = taskItem.querySelector('.edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', () => openEditModal(task.id));
            }

            const deleteBtn = taskItem.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => deleteTask(task.id));
            }

            if (task.completed) {
                completedTasksList.appendChild(taskItem);
            } else {
                pendingTasksList.appendChild(taskItem);
            }
        });

        if (!hasPendingTasks) {
            const msg = document.createElement('li');
            msg.classList.add('no-tasks-message');
            msg.textContent = 'Tidak ada tugas yang belum selesai.';
            pendingTasksList.appendChild(msg);
        }
        if (!hasCompletedTasks) {
            const msg = document.createElement('li');
            msg.classList.add('no-tasks-message');
            msg.textContent = 'Tidak ada tugas yang sudah selesai.';
            completedTasksList.appendChild(msg);
        }
    }

    // Function to fetch all tasks from the API
    function fetchTasks() {
        fetch('/tasks', {
            method: 'GET',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json'
            }
        })
        .then(response => {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return response.json();
            } else {
                return response.text().then(text => {
                    console.error("Server responded with non-JSON content for /tasks:", text);
                    throw new Error("Server response was not valid JSON. Check your Laravel logs (storage/logs/laravel.log) for errors.");
                });
            }
        })
        .then(data => {
            console.log("Fetched tasks:", data);
            renderTasks(data.tasks);
        })
        .catch(error => {
            console.error('Error fetching tasks:', error);
            const errorMessage = `Gagal memuat tugas: ${error.message || 'Error tidak diketahui'}.`;
            pendingTasksList.innerHTML = `<li class="no-tasks-message" style="color: red;">${errorMessage}</li>`;
            completedTasksList.innerHTML = `<li class="no-tasks-message" style="color: red;">${errorMessage}</li>`;
        });
    }

    // Add Task functionality
    addTaskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);

        fetch('/tasks', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json'
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    try {
                        const errorData = JSON.parse(text);
                        throw new Error(errorData.message || 'Unknown error from server');
                    } catch (e) {
                        throw new Error(`Server returned non-JSON error during add: ${text.substring(0, 100)}...`);
                    }
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert(data.message);
                addTaskForm.reset();
                $('#priority').val('now').trigger('change');
                fetchTasks();
            } else {
                alert('Error: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error adding task:', error);
            let errorMessage = 'Gagal menambahkan tugas. Pastikan semua field terisi dengan benar.';
            if (error.message.includes("The selected priority is invalid.")) {
                errorMessage = "Gagal menambahkan tugas: Prioritas yang dipilih tidak valid. Pastikan backend Anda menerima 'now', 'rush', 'plann'.";
            } else if (error.message.startsWith("{") && error.message.includes("errors")) {
                try {
                    const errorObj = JSON.parse(error.message);
                    if (errorObj.errors) {
                        errorMessage = "Validasi Gagal:\n" + Object.values(errorObj.errors).flat().join('\n');
                    } else if (errorObj.message) {
                        errorMessage = "Error: " + errorObj.message;
                    }
                } catch (e) {
                    errorMessage = "Gagal menambahkan tugas. Respon server tidak terduga: " + error.message;
                }
            } else {
                errorMessage = "Gagal menambahkan tugas: " + error.message;
            }
            alert(errorMessage);
        });
    });

    // Toggle Task Completed Status
    function toggleTaskCompleted(taskId, newStatus) {
        fetch(`/tasks/${taskId}/toggle-completed`, {
            method: 'PUT',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ completed: newStatus })
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text); });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log(data.message);
                fetchTasks();
            } else {
                alert('Error: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error toggling task completed status:', error);
            alert('Gagal mengubah status tugas.');
        });
    }

    // Open Edit Modal
    function openEditModal(taskId) {
        fetch(`/tasks/${taskId}/edit`, {
            method: 'GET',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text); });
            }
            return response.json();
        })
        .then(data => {
            if (data.task) {
                const task = data.task;
                editTaskId.value = task.id;
                editDescription.value = task.description;
                editDeadline.value = task.deadline || '';

                $('#editPriority').val(task.priority).trigger('change');

                editTaskModal.style.display = 'flex';
            } else {
                alert('Tugas tidak ditemukan.');
            }
        })
        .catch(error => {
            console.error('Error fetching task for edit:', error);
            alert('Gagal memuat detail tugas.');
        });
    }

    // Close Edit Modal
    closeEditModalBtn.addEventListener('click', () => {
        editTaskModal.style.display = 'none';
        editTaskForm.reset();
        $('#editPriority').val('now').trigger('change');
    });

    // Update Task
    editTaskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const taskId = editTaskId.value;
        const formData = new FormData(this);
        formData.append('_method', 'PUT');

        fetch(`/tasks/${taskId}`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json'
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                 return response.text().then(text => {
                    try {
                        const errorData = JSON.parse(text);
                        throw new Error(errorData.message || 'Unknown error from server');
                    } catch (e) {
                        throw new Error(`Server returned non-JSON error during update: ${text.substring(0, 100)}...`);
                    }
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert(data.message);
                editTaskModal.style.display = 'none';
                editTaskForm.reset();
                $('#editPriority').val('now').trigger('change'); 
                fetchTasks();
            } else {
                alert('Error: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error updating task:', error);
            let errorMessage = 'Gagal memperbarui tugas. Pastikan semua field terisi dengan benar.';
            if (error.message.includes("The selected priority is invalid.")) {
                errorMessage = "Gagal memperbarui tugas: Prioritas yang dipilih tidak valid. Pastikan backend Anda menerima 'now', 'rush', 'plann'.";
            } else if (error.message.startsWith("{") && error.message.includes("errors")) {
                try {
                    const errorObj = JSON.parse(error.message);
                    if (errorObj.errors) {
                        errorMessage = "Validasi Gagal:\n" + Object.values(errorObj.errors).flat().join('\n');
                    } else if (errorObj.message) {
                        errorMessage = "Error: " + errorObj.message;
                    }
                } catch (e) {
                    errorMessage = "Gagal memperbarui tugas. Respon server tidak terduga: " + error.message;
                }
            } else {
                errorMessage = "Gagal memperbarui tugas: " + error.message;
            }
            alert(errorMessage);
        });
    });

    // Delete Task
    function deleteTask(taskId) {
        if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
            fetch(`/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => { throw new Error(text); });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    fetchTasks();
                } else {
                    alert('Error: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error deleting task:', error);
                alert('Gagal menghapus tugas.');
            });
        }
    }

    fetchTasks();
});