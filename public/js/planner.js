document.addEventListener('DOMContentLoaded', function() {
    // --- Elemen DOM ---
    const currentMonthYearHeader = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const calendarBody = document.getElementById('calendarBody'); // Kontainer grid untuk tanggal-tanggal
    const scheduleForDateHeader = document.getElementById('scheduleForDateHeader');
    const noScheduleMessage = document.getElementById('noScheduleMessage');
    const scheduleList = document.getElementById('scheduleList');
    const addScheduleBtn = document.getElementById('addScheduleBtn'); // Tombol Tambah Jadwal
    const viewAllSchedulesBtn = document.getElementById('viewAllSchedulesBtn'); // Tombol Lihat Semua Jadwal

    // Elemen Modal Tambah Jadwal
    const addScheduleModal = document.getElementById('addScheduleModal');
    const closeAddModalBtn = document.getElementById('closeAddModal');
    const addScheduleForm = document.getElementById('addScheduleForm');
    const addScheduleTypeOneTime = document.getElementById('type_one_time');
    const addScheduleTypeRecurring = document.getElementById('type_recurring');
    const addEventDateGroup = document.getElementById('addEventDateGroup');
    const addRecurringDayGroup = document.getElementById('addRecurringDayGroup');

    // Elemen Modal Edit Jadwal
    const editScheduleModal = document.getElementById('editScheduleModal');
    const closeEditModalBtn = document.getElementById('closeEditModal');
    const editScheduleForm = document.getElementById('editScheduleForm');
    const editScheduleId = document.getElementById('editScheduleId');
    const editEventName = document.getElementById('editEventName');
    const editEventTime = document.getElementById('editEventTime');
    const editScheduleTypeOneTime = document.getElementById('edit_type_one_time');
    const editScheduleTypeRecurring = document.getElementById('edit_type_recurring');
    const editEventDate = document.getElementById('editEventDate');
    const editRecurringDay = document.getElementById('editRecurringDay');
    const editEventDateGroup = document.getElementById('editEventDateGroup');
    const editRecurringDayGroup = document.getElementById('editRecurringDayGroup');


    // --- Variabel State ---
    let currentDate = new Date(); 
    let selectedDate = new Date(); 

    // Fungsi untuk mendapatkan token CSRF
    function getCsrfToken() {
        return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    }

    // Memformat objek Date ke `YYYY-MM-DD` untuk panggilan API
    function formatDateForAPI(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Memformat objek Date ke string yang mudah dibaca 
    function formatDate(date) {
        return new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    }

    // Mengganti tampilan kolom tanggal/hari berdasarkan tipe jadwal
    function toggleScheduleTypeFields(type, eventDateGroup, recurringDayGroup) {
        if (type === 'one_time') {
            eventDateGroup.style.display = 'block';
            recurringDayGroup.style.display = 'none';
        } else if (type === 'recurring') {
            eventDateGroup.style.display = 'none';
            recurringDayGroup.style.display = 'block';
        }
    }

    // --- Render Kalender ---
    function renderCalendar() {
        currentMonthYearHeader.textContent = new Intl.DateTimeFormat('id-ID', { year: 'numeric', month: 'long' }).format(currentDate);

        calendarBody.innerHTML = ''; // Bersihkan tanggal-tanggal sebelumnya

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        // Menghitung hari dalam seminggu untuk hari pertama bulan (0 = Minggu, 6 = Sabtu)
        const startDayOfWeek = firstDayOfMonth.getDay();

        const dates = [];

        // Tambahkan hari-hari dari bulan sebelumnya untuk mengisi minggu pertama
        for (let i = startDayOfWeek; i > 0; i--) {
            const prevMonthDate = new Date(year, month, 1 - i);
            dates.push({
                date: prevMonthDate,
                day: prevMonthDate.getDate(),
                isCurrentMonth: false,
                isToday: false
            });
        }

        // Tambahkan hari-hari bulan saat ini
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            const date = new Date(year, month, i);
            dates.push({
                date: date,
                day: i,
                isCurrentMonth: true,
                isToday: date.toDateString() === new Date().toDateString()
            });
        }

        const currentMonthEndDateDayOfWeek = lastDayOfMonth.getDay(); // Hari dalam seminggu dari tanggal terakhir bulan ini
        const cellsNeededForLastRow = (6 - currentMonthEndDateDayOfWeek); // Dari hari terakhir sampai Sabtu (0-6)

        for (let i = 1; i <= cellsNeededForLastRow; i++) {
            const nextMonthDate = new Date(year, month + 1, i);
            dates.push({
                date: nextMonthDate,
                day: nextMonthDate.getDate(),
                isCurrentMonth: false,
                isToday: false
            });
        }

        // Render hari-hari kalender
        dates.forEach(dateInfo => {
            const calendarDay = document.createElement('div');
            calendarDay.classList.add('calendar-date');

            if (dateInfo.isCurrentMonth) {
                calendarDay.classList.add('current-month');
            } else {
                calendarDay.classList.add('other-month');
            }
            if (dateInfo.isToday) {
                calendarDay.classList.add('today');
            }
            // Tambahkan class 'selected' jika hari ini cocok dengan tanggal yang sedang dipilih
            if (selectedDate && dateInfo.date.toDateString() === selectedDate.toDateString()) {
                calendarDay.classList.add('selected');
            }

            calendarDay.innerHTML = `<span>${dateInfo.day}</span>`;

            // Event listener untuk mengklik hari
            calendarDay.addEventListener('click', () => {
                // Hanya izinkan klik pada tanggal bulan saat ini
                if (!dateInfo.isCurrentMonth) {
                    return; // Abaikan klik jika bukan bulan saat ini
                }

                // Hapus class 'selected' dari hari yang sebelumnya dipilih
                const prevSelected = document.querySelector('.calendar-date.selected');
                if (prevSelected) {
                    prevSelected.classList.remove('selected');
                }
                // Tambahkan class 'selected' ke hari yang diklik
                calendarDay.classList.add('selected');
                selectedDate = dateInfo.date; 
                fetchSchedulesForSelectedDate(selectedDate); // Ambil jadwal untuk tanggal yang baru dipilih
            });
            calendarBody.appendChild(calendarDay);
        });

        // Setelah rendering, pastikan jadwal untuk selectedDate awal ditampilkan
        fetchSchedulesForSelectedDate(selectedDate);
    }

    // --- Mengambil & Menampilkan Jadwal ---
    // Mengambil dan menampilkan jadwal untuk tanggal spesifik
    function fetchSchedulesForSelectedDate(date) {
        const formattedDate = formatDateForAPI(date);
        scheduleForDateHeader.textContent = `Jadwal untuk: ${formatDate(date)}`;
        noScheduleMessage.style.display = 'none'; 
        scheduleList.innerHTML = ''; 

        fetch(`/planner/schedules-by-date?date=${formattedDate}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Raw Response (Error):', text);
                    throw new Error(`HTTP error! Status: ${response.status}, Response: ${text}`);
                });
            }
           
            return response.json().catch(err => {
                console.error('JSON parsing error:', err);
                return null; 
            });
        })
        .then(data => {
            if (data && data.schedules) { 
                console.log("Jadwal yang diambil untuk tanggal:", data);
                if (data.schedules.length > 0) {
                    displaySchedules(data.schedules);
                } else {
                    noScheduleMessage.style.display = 'block';
                    noScheduleMessage.textContent = 'Tidak ada jadwal untuk tanggal ini.';
                }
            } else {
                console.error('Data schedules tidak valid atau kosong:', data);
                noScheduleMessage.style.display = 'block';
                noScheduleMessage.textContent = 'Gagal memuat jadwal. (Format data tidak sesuai atau server error)';
            }
        })
        .catch(error => {
            console.error('Error fetching schedules for date:', error);
            noScheduleMessage.style.display = 'block';
            noScheduleMessage.textContent = 'Gagal memuat jadwal. Silakan periksa koneksi atau konsol browser.';
        });
    }

    // Menampilkan daftar jadwal di area scheduleList
    function displaySchedules(schedules) {
        scheduleList.innerHTML = '';
        if (!schedules || schedules.length === 0) {
            noScheduleMessage.style.display = 'block';
            noScheduleMessage.textContent = 'Tidak ada jadwal yang tersedia.';
            return;
        }
        noScheduleMessage.style.display = 'none';

        schedules.forEach(schedule => {
            const scheduleItem = document.createElement('div');
            scheduleItem.classList.add('schedule-item');
            if (schedule.schedule_type === 'recurring') {
                scheduleItem.classList.add('recurring');
            }
            scheduleItem.dataset.id = schedule.id;

            const scheduleDetails = document.createElement('div');
            scheduleDetails.classList.add('schedule-item-content');

            const eventName = document.createElement('strong');
            eventName.textContent = schedule.event_name;
            scheduleDetails.appendChild(eventName);

            const eventTime = document.createElement('span');
            eventTime.textContent = `Waktu: ${schedule.event_time}`;
            scheduleDetails.appendChild(eventTime);

            //Tambah ikon pembeda tipe jadwal 
            const scheduleTypeSpan = document.createElement('span');
            let typeIcon = '';
            let typeText = '';
            if (schedule.schedule_type === 'one_time') {
                typeIcon = '<i class="fas fa-calendar-alt" style="margin-right: 5px; color: #0066cc;"></i>'; // Ikon untuk one-time
                typeText = 'Jadwal Khusus';
            } else { // recurring
                typeIcon = '<i class="fas fa-redo-alt" style="margin-right: 5px; color: #28a745;"></i>'; // Ikon untuk recurring
                typeText = 'Jadwal Rutin';
            }
            scheduleTypeSpan.innerHTML = `${typeIcon}Tipe: ${typeText}`;
            scheduleDetails.appendChild(scheduleTypeSpan);

            // Tambahkan teks khusus tanggal/hari
            if (schedule.schedule_type === 'one_time' && schedule.event_date) {
                const eventDate = document.createElement('span');
                eventDate.textContent = `Tanggal: ${formatDate(new Date(schedule.event_date))}`;
                scheduleDetails.appendChild(eventDate);
            } else if (schedule.schedule_type === 'recurring' && schedule.recurring_day !== null) {
                const recurringDay = document.createElement('span');
                const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                recurringDay.textContent = `Hari: ${days[schedule.recurring_day]}`;
                scheduleDetails.appendChild(recurringDay);
            }

            scheduleItem.appendChild(scheduleDetails);

            const scheduleActions = document.createElement('div');
            scheduleActions.classList.add('schedule-item-actions');

            const editButton = document.createElement('button');
            editButton.classList.add('edit-btn');
            editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>'; // Ikon pensil untuk edit
            editButton.title = 'Edit Jadwal';
            editButton.addEventListener('click', () => openEditModal(schedule.id));
            scheduleActions.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-btn');
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>'; // Ikon tempat sampah untuk hapus
            deleteButton.title = 'Hapus Jadwal';
            deleteButton.addEventListener('click', () => deleteSchedule(schedule.id));
            scheduleActions.appendChild(deleteButton);

            scheduleItem.appendChild(scheduleActions);
            scheduleList.appendChild(scheduleItem);
        });
    }

    // Navigasi Kalender
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Modal Tambah Jadwal
    addScheduleBtn.addEventListener('click', () => {
        addScheduleModal.style.display = 'flex';
        // Set event date default ke selectedDate jika itu jadwal one-time
        const defaultDateInput = addScheduleForm.querySelector('#event_date');
        if (defaultDateInput && addScheduleTypeOneTime.checked) {
            defaultDateInput.value = formatDateForAPI(selectedDate);
        }
        toggleScheduleTypeFields(
            addScheduleTypeOneTime.checked ? 'one_time' : 'recurring',
            addEventDateGroup,
            addRecurringDayGroup
        );
    });

    closeAddModalBtn.addEventListener('click', () => {
        addScheduleModal.style.display = 'none';
        addScheduleForm.reset();
        addScheduleTypeOneTime.checked = true;
        toggleScheduleTypeFields('one_time', addEventDateGroup, addRecurringDayGroup);
    });

    addScheduleTypeOneTime.addEventListener('change', () => toggleScheduleTypeFields('one_time', addEventDateGroup, addRecurringDayGroup));
    addScheduleTypeRecurring.addEventListener('change', () => toggleScheduleTypeFields('recurring', addEventDateGroup, addRecurringDayGroup));

    // Pengiriman Form Tambah Jadwal
    addScheduleForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const scheduleType = formData.get('schedule_type');
        const eventDate = formData.get('event_date');
        const recurringDay = formData.get('recurring_day');

        if (scheduleType === 'one_time' && !eventDate) {
            alert('Tanggal acara harus diisi untuk jadwal khusus.');
            return;
        }
        if (scheduleType === 'recurring' && !recurringDay) {
            alert('Hari rutin harus diisi untuk jadwal rutin.');
            return;
        }

        fetch('/planner', { 
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
                'Accept': 'application/json'
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(`HTTP error! Status: ${response.status}, Response: ${text}`); });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert(data.message);
                addScheduleModal.style.display = 'none';
                addScheduleForm.reset();
                addScheduleTypeOneTime.checked = true;
                toggleScheduleTypeFields('one_time', addEventDateGroup, addRecurringDayGroup);
                fetchSchedulesForSelectedDate(selectedDate);
            } else {
                alert('Gagal menambahkan jadwal: ' + (data.message || JSON.stringify(data.errors)));
            }
        })
        .catch(error => {
            console.error('Error adding schedule:', error);
            alert('Terjadi kesalahan saat menambahkan jadwal. Pastikan rute dan controller sudah benar.');
        });
    });

    // Tombol Lihat Semua Jadwal
    viewAllSchedulesBtn.addEventListener('click', function() {
        scheduleForDateHeader.textContent = 'Semua Jadwal';
        noScheduleMessage.style.display = 'none';
        scheduleList.innerHTML = '';

        fetch('/planner/all-schedules', { 
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(`HTTP error! Status: ${response.status}, Response: ${text}`); });
            }
            return response.json().catch(err => {
                console.error('JSON parsing error for all schedules:', err);
                return null;
            });
        })
        .then(data => {
            if (data && data.schedules) {
                console.log("Semua jadwal yang diambil:", data);
                if (data.schedules.length > 0) {
                    displaySchedules(data.schedules);
                } else {
                    noScheduleMessage.style.display = 'block';
                    noScheduleMessage.textContent = 'Tidak ada jadwal yang tersedia.';
                }
            } else {
                console.error('Data semua jadwal tidak valid atau kosong:', data);
                noScheduleMessage.style.display = 'block';
                noScheduleMessage.textContent = 'Gagal memuat semua jadwal. (Format data tidak sesuai atau server error)';
            }
        })
        .catch(error => {
            console.error('Error fetching all schedules:', error);
            noScheduleMessage.style.display = 'block';
            noScheduleMessage.textContent = 'Gagal memuat semua jadwal. Silakan periksa koneksi atau konsol browser.';
        });
    });


    // --- Logika Edit Jadwal ---

    // Buka Modal Edit
    function openEditModal(scheduleId) {
        fetch(`/planner/${scheduleId}/edit`, { 
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(`HTTP error! Status: ${response.status}, Response: ${text}`); });
            }
            return response.json();
        })
        .then(data => {
            if (data.schedule) {
                const schedule = data.schedule;
                editScheduleId.value = schedule.id;
                editEventName.value = schedule.event_name;
                editEventTime.value = schedule.event_time;

                if (schedule.schedule_type === 'one_time') {
                    editScheduleTypeOneTime.checked = true;
                    editEventDate.value = schedule.event_date; 
                    editRecurringDay.value = '';
                } else {
                    editScheduleTypeRecurring.checked = true;
                    editRecurringDay.value = schedule.recurring_day;
                    editEventDate.value = '';
                }
                toggleScheduleTypeFields(
                    schedule.schedule_type,
                    editEventDateGroup,
                    editRecurringDayGroup
                );
                editScheduleModal.style.display = 'flex';
            } else {
                alert('Jadwal tidak ditemukan.');
            }
        })
        .catch(error => {
            console.error('Error fetching schedule for edit:', error);
            alert('Gagal memuat detail jadwal. Pastikan rute dan controller sudah benar.');
        });
    }

    closeEditModalBtn.addEventListener('click', () => {
        editScheduleModal.style.display = 'none';
        editScheduleForm.reset();
        editScheduleTypeOneTime.checked = true;
        toggleScheduleTypeFields('one_time', editEventDateGroup, editRecurringDayGroup);
    });

    editScheduleTypeOneTime.addEventListener('change', () => toggleScheduleTypeFields('one_time', editEventDateGroup, editRecurringDayGroup));
    editScheduleTypeRecurring.addEventListener('change', () => toggleScheduleTypeFields('recurring', editEventDateGroup, editRecurringDayGroup));

    // Pengiriman Form Edit Jadwal
    editScheduleForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const scheduleId = editScheduleId.value;
        const formData = new FormData(this);
        formData.append('_method', 'PUT'); 

        const scheduleType = formData.get('schedule_type');
        const eventDate = formData.get('event_date');
        const recurringDay = formData.get('recurring_day');

        if (scheduleType === 'one_time' && !eventDate) {
            alert('Tanggal acara harus diisi untuk jadwal khusus.');
            return;
        }
        if (scheduleType === 'recurring' && !recurringDay) {
            alert('Hari rutin harus diisi untuk jadwal rutin.');
            return;
        }


        fetch(`/planner/${scheduleId}`, { 
            method: 'POST', 
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
                'Accept': 'application/json'
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(`HTTP error! Status: ${response.status}, Response: ${text}`); });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert(data.message);
                editScheduleModal.style.display = 'none';
                editScheduleForm.reset();
                editScheduleTypeOneTime.checked = true;
                toggleScheduleTypeFields('one_time', editEventDateGroup, editRecurringDayGroup);
                fetchSchedulesForSelectedDate(selectedDate);
            } else {
                alert('Gagal memperbarui jadwal: ' + (data.message || JSON.stringify(data.errors)));
            }
        })
        .catch(error => {
            console.error('Error updating schedule:', error);
            alert('Terjadi kesalahan saat memperbarui jadwal. Pastikan rute dan controller sudah benar.');
        });
    });

    // Hapus Jadwal
    function deleteSchedule(scheduleId) {
        if (confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
            fetch(`/planner/${scheduleId}`, { 
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => { throw new Error(`HTTP error! Status: ${response.status}, Response: ${text}`); });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    fetchSchedulesForSelectedDate(selectedDate);
                } else {
                    alert('Gagal menghapus jadwal: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error deleting schedule:', error);
                alert('Terjadi kesalahan saat menghapus jadwal. Pastikan rute dan controller sudah benar.');
            });
        }
    }

    // --- Pemuatan Awal ---
    renderCalendar();
});