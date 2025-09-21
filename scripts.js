(function(){
    // Accessibility: focus-visible outline
    const style = document.createElement('style');
    style.textContent = '*:focus-visible{outline:2px solid var(--accent); outline-offset:2px} a,button{outline:none}';
    document.head.appendChild(style);

    // Enforce dark mode only: remove any saved light mode and the toggle button
    try { localStorage.removeItem('theme'); } catch(e) {}
    document.body.classList.remove('light');
    const btn = document.getElementById('toggleTheme');
    if(btn){ btn.remove(); }

    // Hover light effect on tiles
    document.querySelectorAll('.tile').forEach(function(el){
        el.addEventListener('mousemove', function(e){
            const rect = el.getBoundingClientRect();
            el.style.setProperty('--x', (e.clientX - rect.left) + 'px');
            el.style.setProperty('--y', (e.clientY - rect.top) + 'px');
        });
    });

    // Charts per page
    // Data helpers (localStorage)
    const storage = {
        get(key, fallback){
            try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch(e){ return fallback; }
        },
        set(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
    };

    // Initialize defaults if missing
    const defaultAttendance = { labels: ['Mon','Tue','Wed','Thu','Fri'], data: [80,82,85,83,84] };
    const defaultSubjects = { labels: ['Math','Sci','Eng','Hist','Geo'], data: [78,81,74,69,72] };
    const defaultStudents = [
        { id: 'S123', name: 'Aisha Khan', className: 'Grade 8', section: 'A', status: 'Active' },
        { id: 'S124', name: 'John Lee', className: 'Grade 8', section: 'B', status: 'Active' }
    ];
    const defaultClasses = [
        { id: 'C1', name: 'Grade 8', sections: ['A', 'B', 'C'], sectionHead: 'Ms. Patel' }
    ];
    if(storage.get('attendanceSeries') == null) storage.set('attendanceSeries', defaultAttendance);
    if(storage.get('subjectAverages') == null) storage.set('subjectAverages', defaultSubjects);
    if(storage.get('students') == null) storage.set('students', defaultStudents);
    if(storage.get('classes') == null) storage.set('classes', defaultClasses);

    // --- Auth (localStorage-based demo) ---
    const auth = {
        usersKey: 'users',
        currentKey: 'currentUser',
        getUsers(){ return storage.get(this.usersKey, []); },
        setUsers(users){ storage.set(this.usersKey, users); },
        getCurrent(){ return storage.get(this.currentKey, null); },
        setCurrent(user){ storage.set(this.currentKey, user); },
        signOut(){ localStorage.removeItem(this.currentKey); }
    };
    if(auth.getUsers().length === 0){
        auth.setUsers([
            { name: 'Admin', email: 'admin@school.edu', password: 'admin123', role: 'admin', phone: '+1 (555) 123-4567' },
            { name: 'Mr. Teacher', email: 'teacher@school.edu', password: 'teacher123', role: 'teacher', phone: '+1 (555) 987-6543' }
        ]);
    }

    const currentFile = (location.pathname.split('/').pop() || '').toLowerCase();
    const currentBase = currentFile.replace(/\.html$/, '') || 'index';
    const publicPages = ['login', 'signup'];

    // Redirect logic
    if(publicPages.indexOf(currentBase) === -1){
        const cu = auth.getCurrent();
        if(!cu){ 
            // Auto-login for testing
            auth.setCurrent({ name: 'Test Admin', email: 'admin@test.com', role: 'admin', phone: '+1 (555) 123-4567' });
            console.log('Auto-logged in for testing');
        }
    } else {
        const cu = auth.getCurrent();
        if(cu){ location.href = 'index.html'; }
    }

    // Global functions for populating class and section dropdowns
    window.populateClassDropdown = function(selectId, includeEmpty = true) {
        const select = document.getElementById(selectId);
        if(!select) return;
        
        const classes = storage.get('classes', []);
        select.innerHTML = '';
        
        if(includeEmpty) {
            select.innerHTML = '<option value="">Select Class</option>';
        }
        
        // Add all classes entered by users
        classes.forEach(function(cls) {
            const option = document.createElement('option');
            option.value = cls.name;
            option.textContent = cls.name;
            select.appendChild(option);
        });
        
        // Debug: Log the classes being populated
        console.log('Populating class dropdown with:', classes);
    };
    
    window.populateSectionDropdown = function(selectId, selectedClass = null, includeEmpty = true) {
        const select = document.getElementById(selectId);
        if(!select) return;
        
        select.innerHTML = '';
        if(includeEmpty) {
            select.innerHTML = '<option value="">Select Section</option>';
        }
        
        if(selectedClass) {
            const classes = storage.get('classes', []);
            const classData = classes.find(c => c.name === selectedClass);
            if(classData) {
                // Add all sections for the selected class
                classData.sections.forEach(function(section) {
                    const option = document.createElement('option');
                    option.value = section;
                    option.textContent = section;
                    select.appendChild(option);
                });
                
                // Debug: Log the sections being populated
                console.log('Populating section dropdown for class', selectedClass, 'with sections:', classData.sections);
            } else {
                console.log('No class data found for:', selectedClass);
            }
        }
    };
    
    window.updateSectionDropdown = function(classSelectId, sectionSelectId) {
        const classSelect = document.getElementById(classSelectId);
        const sectionSelect = document.getElementById(sectionSelectId);
        
        if(classSelect && sectionSelect) {
            classSelect.addEventListener('change', function() {
                const selectedClass = this.value;
                populateSectionDropdown(sectionSelectId, selectedClass);
            });
        }
    };

    // Mount user badge and logout in navbar
    (function(){
        const nav = document.querySelector('.navbar');
        if(!nav) return;
        const holder = document.createElement('div');
        holder.style.display = 'flex';
        holder.style.gap = '8px';
        holder.style.marginLeft = '8px';
        const user = auth.getCurrent();
        if(user){
            const badge = document.createElement('span');
            badge.style.padding = '6px 10px';
            badge.style.border = '1px solid var(--border)';
            badge.style.borderRadius = '10px';
            badge.style.color = 'var(--text-secondary)';
            badge.setAttribute('aria-label', 'Current user');
            badge.textContent = user.name + ' (' + user.role + ')';
            const logout = document.createElement('button');
            logout.className = 'btn btn-sm btn-outline-light';
            logout.textContent = 'Logout';
            logout.setAttribute('aria-label', 'Log out');
            logout.addEventListener('click', function(){ auth.signOut(); location.href = 'login.html'; });
            holder.appendChild(badge);
            holder.appendChild(logout);
        }
        nav.appendChild(holder);
    })();

    // Apply role-based restrictions
    (function applyRoleRestrictions(){
        const user = auth.getCurrent();
        if(!user) return;
        
        const restrictedElements = document.querySelectorAll('[data-role-restricted]');
        restrictedElements.forEach(function(el){
            const restrictedRoles = el.getAttribute('data-role-restricted').split(',').map(r => r.trim());
            if(restrictedRoles.includes(user.role)){
                el.classList.add('restricted');
                el.title = 'Access denied for ' + user.role + ' role';
            }
        });
        
        // Hide Data Manager for students and parents
        if(['student', 'parent'].includes(user.role)){
            const dataLink = document.querySelector('a[href="data.html"]');
            if(dataLink) dataLink.style.display = 'none';
        }
    })();

    // Handle login form
    if(currentBase === 'login'){
        const form = document.querySelector('.auth-form');
        if(form){
            form.addEventListener('submit', function(e){
                e.preventDefault();
                const email = (document.getElementById('email')||{}).value?.trim().toLowerCase();
                const password = (document.getElementById('password')||{}).value;
                const users = auth.getUsers();
                const user = users.find(function(u){ return u.email.toLowerCase() === email && u.password === password; });
                if(!user){ alert('Invalid email or password'); return; }
                auth.setCurrent({ name: user.name, email: user.email, role: user.role, phone: user.phone || '' });
                location.href = 'index.html';
            });
        }
    }
    // Handle signup form
    if(currentBase === 'signup'){
        const form = document.querySelector('.auth-form');
        if(form){
            form.addEventListener('submit', function(e){
                e.preventDefault();
                const first = (document.getElementById('firstName')||{}).value?.trim() || '';
                const last = (document.getElementById('lastName')||{}).value?.trim() || '';
                const email = (document.getElementById('email')||{}).value?.trim().toLowerCase();
                const role = (document.getElementById('role')||{}).value;
                const password = (document.getElementById('password')||{}).value;
                const confirm = (document.getElementById('confirmPassword')||{}).value;
                const phone = (document.getElementById('phone')||{}).value?.trim() || '';
                if(!email || !password){ alert('Email and password are required'); return; }
                if(password !== confirm){ alert('Passwords do not match'); return; }
                const users = auth.getUsers();
                if(users.some(function(u){ return u.email.toLowerCase() === email; })){ alert('Email already registered'); return; }
                const name = (first + ' ' + last).trim() || email;
                users.push({ name, email, password, role, phone });
                auth.setUsers(users);
                alert('Account created. Please log in.');
                location.href = 'login.html';
            });
        }
    }

    // Populate Data Manager forms and handle submits
    if(document.body.getAttribute('data-page') === 'data'){
        const att = storage.get('attendanceSeries', defaultAttendance);
        const sub = storage.get('subjectAverages', defaultSubjects);
        const attLabels = document.getElementById('attLabels');
        const attPresent = document.getElementById('attPresent');
        const subLabels = document.getElementById('subLabels');
        const subAverages = document.getElementById('subAverages');
        if(attLabels) attLabels.value = att.labels.join(',');
        if(attPresent) attPresent.value = att.data.join(',');
        if(subLabels) subLabels.value = sub.labels.join(',');
        if(subAverages) subAverages.value = sub.data.join(',');

        const formAttendance = document.getElementById('formAttendance');
        const formSubjects = document.getElementById('formSubjects');
        if(formAttendance){
            formAttendance.addEventListener('submit', function(e){
                e.preventDefault();
                const labels = attLabels.value.split(',').map(s=>s.trim()).filter(Boolean);
                const data = attPresent.value.split(',').map(s=>Number(s.trim())).filter(n=>!Number.isNaN(n));
                storage.set('attendanceSeries', { labels, data });
                alert('Attendance series saved. Charts will use this data.');
            });
        }
        if(formSubjects){
            formSubjects.addEventListener('submit', function(e){
                e.preventDefault();
                const labels = subLabels.value.split(',').map(s=>s.trim()).filter(Boolean);
                const data = subAverages.value.split(',').map(s=>Number(s.trim())).filter(n=>!Number.isNaN(n));
                storage.set('subjectAverages', { labels, data });
                alert('Subject averages saved. Charts will use this data.');
            });
        }

        // Students list management
        const formStudent = document.getElementById('formStudent');
        const tbody = document.getElementById('dataStudentsBody');
        const renderStudents = function(){
            const students = storage.get('students', []);
            if(!tbody) return;
            if(students.length === 0){
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No students yet</td></tr>';
                return;
            }
            tbody.innerHTML = students.map(function(s){
                return '<tr>'+
                    '<td>'+s.id+'</td>'+
                    '<td><a href="student.html?id='+encodeURIComponent(s.id)+'">'+s.name+'</a></td>'+
                    '<td>'+s.className+'</td>'+
                    '<td>'+s.section+'</td>'+
                    '<td><button class="btn btn-outline-danger btn-sm" data-remove="'+s.id+'" aria-label="Remove '+s.name+'">Remove</button></td>'+
                '</tr>';
            }).join('');
        };
        renderStudents();
        if(formStudent){
            formStudent.addEventListener('submit', function(e){
                e.preventDefault();
                const id = document.getElementById('stuId').value.trim();
                const name = document.getElementById('stuName').value.trim();
                const className = document.getElementById('stuClass').value.trim();
                const section = document.getElementById('stuSection').value.trim();
                if(!id || !name) return;
                const students = storage.get('students', []);
                if(students.some(function(s){ return s.id === id; })){
                    alert('Student ID already exists.');
                    return;
                }
                students.push({ id, name, className, section });
                storage.set('students', students);
                renderStudents();
                formStudent.reset();
            });
        }
        document.addEventListener('click', function(e){
            const btn = e.target.closest('button[data-remove]');
            if(!btn) return;
            const id = btn.getAttribute('data-remove');
            const students = storage.get('students', []);
            const next = students.filter(function(s){ return s.id !== id; });
            storage.set('students', next);
            const row = btn.closest('tr'); if(row) row.remove();
            if(next.length === 0) renderStudents();
        });
    }

    const page = document.body.getAttribute('data-page');
    if(typeof Chart !== 'undefined'){
        if(page === 'home'){
            const ctx1 = document.getElementById('attendanceChart');
            const ctx2 = document.getElementById('gradesChart');
            const att = storage.get('attendanceSeries', defaultAttendance);
            const sub = storage.get('subjectAverages', defaultSubjects);
            if(ctx1){
                new Chart(ctx1, {
                    type: 'line',
                    data: { labels: att.labels, datasets: [{ label: 'Present', data: att.data, borderColor: '#2ecc71', fill: false }] },
                    options: { plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text') } } }, scales: { x: { ticks: { color: 'var(--muted)' } }, y: { ticks: { color: 'var(--muted)' } } } }
                });
            }
            if(ctx2){
                new Chart(ctx2, {
                    type: 'bar',
                    data: { labels: sub.labels, datasets: [{ label: 'Avg %', data: sub.data, backgroundColor: '#6c63ff' }] },
                    options: { plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text') } } }, scales: { x: { ticks: { color: 'var(--muted)' } }, y: { ticks: { color: 'var(--muted)' } } } }
                });
            }
        }
        if(page === 'reports'){
            const ctx3 = document.getElementById('reportAttendance');
            const ctx4 = document.getElementById('reportGrades');
            const att = storage.get('attendanceSeries', defaultAttendance);
            const sub = storage.get('subjectAverages', defaultSubjects);
            if(ctx3){ new Chart(ctx3, { type: 'line', data: { labels: att.labels, datasets: [{ label: 'Attendance %', data: att.data, borderColor: '#00d4ff', fill: false }] } }); }
            if(ctx4){ new Chart(ctx4, { type: 'radar', data: { labels: sub.labels, datasets: [{ label: 'Class Avg', data: sub.data, borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.2)' }] } }); }
        }
        if(page === 'student'){
            const ctx5 = document.getElementById('studentProgress');
            if(ctx5){ new Chart(ctx5, { type: 'line', data: { labels: ['T1','T2','T3'], datasets: [{ label: 'Average %', data: [72,76,81], borderColor: '#2ecc71' }] } }); }
        }
    }

    // Render Students page from storage
    if(page === 'students'){
        const tbody = document.querySelector('.table-card tbody');
        window.students = storage.get('students', []);
        window.filteredStudents = window.students;
        const groupedContainer = document.getElementById('studentsGrouped');
        
        console.log('Students page loaded');
        console.log('Students data:', window.students);
        console.log('Table body element:', tbody);
        
        // Initialize classes data if not exists
        const defaultClasses = [
            { id: 'C1', name: 'Grade 8', sections: ['A', 'B', 'C'], sectionHead: 'Ms. Patel' }
        ];
        if(storage.get('classes') == null) storage.set('classes', defaultClasses);
        
        // Function to refresh all dropdowns
        function refreshAllDropdowns() {
            console.log('Refreshing all dropdowns...');
            const classes = storage.get('classes', []);
            console.log('Current classes data:', classes);
            
        populateClassDropdown('addStudentClass');
        populateClassDropdown('editStudentClass');
        updateSectionDropdown('addStudentClass', 'addStudentSection');
        updateSectionDropdown('editStudentClass', 'editStudentSection');
        
            // Update count indicators and display
            updateCountIndicators();
            displayAvailableClasses();
        }
        
        // Function to update count indicators
        function updateCountIndicators() {
            const classes = storage.get('classes', []);
            const classCount = classes.length;
            const totalSections = classes.reduce((total, cls) => total + cls.sections.length, 0);
            
            const classCountElement = document.getElementById('classCount');
            const sectionCountElement = document.getElementById('sectionCount');
            
            if(classCountElement) {
                classCountElement.textContent = `(${classCount} classes available)`;
            }
            if(sectionCountElement) {
                sectionCountElement.textContent = `(${totalSections} sections available)`;
            }
        }
        
        // Function to display available classes and sections
        function displayAvailableClasses() {
            const classes = storage.get('classes', []);
            const infoContainer = document.getElementById('availableClassesInfo');
            
            if(!infoContainer) return;
            
            if(classes.length === 0) {
                infoContainer.innerHTML = '<div class="text-muted">No classes available. <a href="classes.html">Add classes and sections</a> to get started.</div>';
                return;
            }
            
            const html = classes.map(function(cls) {
                const sectionsList = cls.sections.length > 0 ? cls.sections.join(', ') : 'No sections';
                return `
                    <div class="class-info mb-2">
                        <strong>${cls.name}</strong> 
                        <span class="text-muted">(${cls.sections.length} sections)</span>
                        <div class="text-muted small">Sections: ${sectionsList}</div>
                        ${cls.sectionHead ? `<div class="text-muted small">Section Head: ${cls.sectionHead}</div>` : ''}
                    </div>
                `;
            }).join('');
            
            infoContainer.innerHTML = html;
        }
        
        // Populate class and section dropdowns on page load
        refreshAllDropdowns();
        
        // Refresh dropdowns when returning from classes page (check for URL parameter)
        const urlParams = new URLSearchParams(window.location.search);
        if(urlParams.get('refresh') === 'true') {
            refreshAllDropdowns();
            // Remove the refresh parameter from URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        function renderStudentsTable(studentsToRender = window.filteredStudents){
            console.log('renderStudentsTable called with:', studentsToRender);
            if(tbody){
                const html = studentsToRender.map(function(s, idx){
                    return '<tr data-student-id="'+s.id+'">'+
                        '<td>'+s.id+'</td>'+
                        '<td><a href="student.html?id='+encodeURIComponent(s.id)+'">'+s.name+'</a></td>'+
                        '<td>'+s.className+'</td>'+
                        '<td>'+s.section+'</td>'+
                        '<td class="edit-buttons">'+
                            '<button class="btn btn-sm btn-outline-primary me-1" onclick="editStudent(\''+s.id+'\')" data-role-restricted="student,parent">Edit</button>'+
                            '<button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(\''+s.id+'\')" data-role-restricted="student,parent">Delete</button>'+
                        '</td>'+
                    '</tr>';
                }).join('') || '<tr><td colspan="5" class="text-center text-muted">No students found</td></tr>';
                
                console.log('Generated HTML:', html);
                tbody.innerHTML = html;
            } else {
                console.error('tbody element not found!');
            }
        }
        
        renderStudentsTable();
        
        // Test: Manually add some students if none exist
        if(window.students.length === 0){
            console.log('No students found, adding default students');
            window.students = [
                { id: 'S123', name: 'Aisha Khan', className: 'Grade 8', section: 'A', status: 'Active' },
                { id: 'S124', name: 'John Lee', className: 'Grade 8', section: 'B', status: 'Active' }
            ];
            window.filteredStudents = window.students;
            storage.set('students', window.students);
            renderStudentsTable();
        }

        // Render grouped by class and section
        function renderGrouped(){
            if(!groupedContainer) return;
            const byClass = {};
            window.students.forEach(function(s){
                const key = s.className || 'Unassigned';
                if(!byClass[key]) byClass[key] = {};
                const sec = s.section || '—';
                if(!byClass[key][sec]) byClass[key][sec] = [];
                byClass[key][sec].push(s);
            });
            const html = Object.keys(byClass).sort().map(function(cls){
                const sectionsHtml = Object.keys(byClass[cls]).sort().map(function(sec){
                    const list = byClass[cls][sec].map(function(s){ return '<span class="badge text-bg-success">'+s.name+' ('+s.id+')</span>'; }).join(' ');
                    return '<div class="group-body"><strong>Section '+sec+':</strong> '+ (list || '<span class="text-muted">No students</span>') +'</div>';
                }).join('');
                return '<div class="class-group"><header>'+cls+'</header>'+sectionsHtml+'</div>';
            }).join('') || '<div class="text-muted">No students yet</div>';
            groupedContainer.innerHTML = html;
        }
        renderGrouped();
        displayAvailableClasses();
        
        // Add search functionality
        const searchInput = document.querySelector('.search input');
        if(searchInput){
            searchInput.addEventListener('input', function(e){
                const searchTerm = e.target.value.toLowerCase().trim();
                if(searchTerm === ''){
                    window.filteredStudents = window.students;
                } else {
                    window.filteredStudents = window.students.filter(function(s){
                        return s.name.toLowerCase().includes(searchTerm) || 
                               s.id.toLowerCase().includes(searchTerm) ||
                               s.className.toLowerCase().includes(searchTerm) ||
                               s.section.toLowerCase().includes(searchTerm);
                    });
                }
                renderStudentsTable();
            });
        }

        // Refresh dropdowns when Add Student modal is opened
        const addStudentLink = document.querySelector('a[href="#modal-add-student"]');
        if(addStudentLink){
            addStudentLink.addEventListener('click', function(){
                // Refresh dropdowns to ensure latest data is shown
                refreshAllDropdowns();
            });
        }

        // Handle Add Student submit (teachers/admins only)
        const addBtn = document.getElementById('addStudentSubmit');
        if(addBtn){
            addBtn.addEventListener('click', function(){
                const user = auth.getCurrent();
                if(!user || ['student','parent'].includes(user.role)){
                    alert('Access denied. Only teachers, section heads, or admins can add students.');
                    return;
                }
                const name = (document.getElementById('addStudentName')||{}).value?.trim();
                const className = (document.getElementById('addStudentClass')||{}).value?.trim();
                const section = (document.getElementById('addStudentSection')||{}).value?.trim();
                if(!name){ alert('Please enter a name'); return; }
                let students = storage.get('students', []);
                // Generate simple ID S###
                const maxNum = students.reduce(function(acc, s){
                    const m = /^S(\d+)$/.exec(s.id || '');
                    return Math.max(acc, m ? parseInt(m[1],10) : 0);
                }, 124);
                const newId = 'S' + (maxNum + 1);
                const newStudent = { id: newId, name: name, className: className || 'Grade 8', section: section || 'A', status: 'Active' };
                students.push(newStudent);
                storage.set('students', students);
                
                // Update global variables
                window.students = students;
                window.filteredStudents = students;
                // Update table immediately
                if(tbody){
                    const row = document.createElement('tr');
                    row.innerHTML = '<td>'+newStudent.id+'</td>'+
                        '<td><a href="student.html?id='+encodeURIComponent(newStudent.id)+'">'+newStudent.name+'</a></td>'+
                        '<td>'+newStudent.className+'</td>'+
                        '<td>'+newStudent.section+'</td>'+
                        '<td class="edit-buttons">'+
                            '<button class="btn btn-sm btn-outline-primary me-1" onclick="editStudent(\''+newStudent.id+'\')" data-role-restricted="student,parent">Edit</button>'+
                            '<button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(\''+newStudent.id+'\')" data-role-restricted="student,parent">Delete</button>'+
                        '</td>';
                    if(tbody.querySelector('td[colspan]')) tbody.innerHTML = '';
                    tbody.appendChild(row);
                }
                // Close modal
                location.hash = '';
                alert('Student added: '+newStudent.name);
                renderStudentsTable();
                renderGrouped();
            });
        }
        
        // Global student management functions
        window.editStudent = function(studentId){
            console.log('editStudent function called with ID:', studentId);
            alert('Edit function called for student: ' + studentId);
            
            const user = auth.getCurrent();
            console.log('Current user:', user);
            if(!user){
                alert('No user logged in. Please log in first.');
                return;
            }
            if(['student', 'parent'].includes(user.role)){
                alert('Access denied. Only teachers and administrators can edit students.');
                return;
            }
            
            // Refresh dropdowns to ensure latest data is shown
            refreshAllDropdowns();
            
            const students = storage.get('students', []);
            console.log('All students:', students);
            
            const student = students.find(s => s.id === studentId);
            console.log('Found student:', student);
            
            if(!student) {
                console.error('Student not found with ID:', studentId);
                alert('Student not found!');
                return;
            }
            
            // Populate form with student data
            document.getElementById('editStudentId').value = student.id;
            document.getElementById('editStudentName').value = student.name;
            document.getElementById('editStudentClass').value = student.className || '';
            document.getElementById('editStudentSection').value = student.section || '';
            document.getElementById('editStudentStatus').value = student.status || 'Active';
            
            console.log('Form populated with:', {
                id: student.id,
                name: student.name,
                className: student.className,
                section: student.section,
                status: student.status
            });
            
            // Show modal
            console.log('Setting location hash to modal-edit-student');
            location.hash = 'modal-edit-student';
        };
        
        window.deleteStudent = function(studentId){
            const user = auth.getCurrent();
            if(['student', 'parent'].includes(user.role)){
                alert('Access denied. Only teachers and administrators can delete students.');
                return;
            }
            
            if(confirm('Are you sure you want to delete this student? This action cannot be undone.')){
                let students = storage.get('students', []);
                const updatedStudents = students.filter(s => s.id !== studentId);
                storage.set('students', updatedStudents);
                
                // Update global variables
                window.students = updatedStudents;
                window.filteredStudents = updatedStudents;
                renderStudentsTable();
                renderGrouped();
                alert('Student deleted successfully.');
            }
        };
        
        window.saveStudentEdit = function(){
            console.log('saveStudentEdit function called');
            
            const studentId = document.getElementById('editStudentId').value;
            const name = document.getElementById('editStudentName').value.trim();
            const className = document.getElementById('editStudentClass').value;
            const section = document.getElementById('editStudentSection').value;
            const status = document.getElementById('editStudentStatus').value;
            
            console.log('Form values:', { studentId, name, className, section, status });
            
            if(!name){
                alert('Please enter a name');
                return;
            }
            
            if(!className){
                alert('Please select a class');
                return;
            }
            
            if(!section){
                alert('Please select a section');
                return;
            }
            
            let students = storage.get('students', []);
            console.log('Current students:', students);
            
            const studentIndex = students.findIndex(s => s.id === studentId);
            console.log('Student index:', studentIndex);
            
            if(studentIndex !== -1){
                students[studentIndex] = { 
                    id: studentId, 
                    name, 
                    className, 
                    section, 
                    status: status || 'Active' 
                };
                storage.set('students', students);
                console.log('Student updated:', students[studentIndex]);
                
                // Update the global students and filteredStudents variables
                window.students = students;
                window.filteredStudents = students;
                renderStudentsTable();
                renderGrouped();
                closeModal('modal-edit-student');
                alert('Student updated successfully.');
            } else {
                console.error('Student not found with ID:', studentId);
                alert('Student not found!');
            }
        };
        
        window.closeModal = function(modalId){
            location.hash = '';
        };
        
        // Test function to verify save button is working
        window.testSaveButton = function(){
            console.log('Test save button clicked');
            alert('Save button is working!');
        };
        
    }

    // Attendance selection page: require class & section, then redirect to marking page
    if(page === 'attendance'){
        const form = document.getElementById('attendanceSelectForm') || document.querySelector('form');
        const user = auth.getCurrent();
        const isRestricted = user && ['student', 'parent'].includes(user.role);

        // Populate class and section dropdowns
        populateClassDropdown('attendanceClass');
        updateSectionDropdown('attendanceClass', 'attendanceSection');

        if(form){
            if(isRestricted){
                const content = document.querySelector('.content');
                const notice = document.createElement('div');
                notice.className = 'alert alert-warning mt-3';
                notice.textContent = 'Only teachers and administrators can mark attendance.';
                if(content){ content.appendChild(notice); }
                form.querySelectorAll('input,select,button').forEach(function(el){ el.disabled = true; });
            } else {
                // Default date to today if empty
                const dateInput = document.getElementById('attendanceDate') || form.querySelector('input[type="date"]');
                if(dateInput && !dateInput.value){ dateInput.value = new Date().toISOString().split('T')[0]; }
                form.addEventListener('submit', function(e){
                    e.preventDefault();
                    const dateEl = document.getElementById('attendanceDate') || form.querySelector('input[type="date"]');
                    const classEl = document.getElementById('attendanceClass') || form.querySelectorAll('select')[0];
                    const sectionEl = document.getElementById('attendanceSection') || form.querySelectorAll('select')[1];
                    const date = (dateEl && dateEl.value) || new Date().toISOString().split('T')[0];
                    const cls = classEl && classEl.value;
                    const section = sectionEl && sectionEl.value;
                    if(!cls || !section){ alert('Please select class and section.'); return; }
                    const params = new URLSearchParams({ date: date, class: cls, section: section });
                    location.href = 'mark-attendance.html?' + params.toString();
                });
            }
        }
    }

    // Attendance marking page: guard by role and params, then render students
    if(page === 'mark-attendance' || currentBase === 'mark-attendance'){
        const user = auth.getCurrent();
        if(!user){ return; }
        if(['student', 'parent'].includes(user.role)){
            alert('Access denied. Only teachers and administrators can mark attendance.');
            location.href = 'attendance.html';
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const date = params.get('date');
        const grade = params.get('class');
        const section = params.get('section');
        if(!date || !grade || !section){ location.href = 'attendance.html'; return; }

        // Set context date for saving
        window.attendanceContextDate = date;

        // Update heading
        const heading = document.getElementById('attendanceHeading');
        if(heading){ heading.textContent = 'Mark Attendance  ' + grade + ' Section ' + section + ' (' + date + ')'; }

        // Load and render filtered students
        const tbody = document.getElementById('attendanceTableBody');
        const students = storage.get('students', []);
        const filtered = students.filter(function(s){ return (s.className === grade) && (s.section === section); });
        if(tbody){
            if(filtered.length === 0){
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No students found for this class/section</td></tr>';
            } else {
                tbody.innerHTML = filtered.map(function(s, idx){
                    return '<tr>'+
                        '<td>'+(idx+1)+'</td>'+
                        '<td>'+s.name+'</td>'+
                        '<td>'+
                            '<label class="attendance-toggle">'+
                                '<input type="checkbox" class="attendance-checkbox" data-id="'+s.id+'" checked onchange="updateAttendanceLabel(this)">'+
                                '<span class="toggle-slider"></span>'+
                                '<span class="toggle-label">Present</span>'+
                            '</label>'+
                        '</td>'+
                    '</tr>';
                }).join('');
            }
        }
    }

    // Global attendance functions
    window.toggleAllCheckboxes = function(selectAllCheckbox){
        const checkboxes = document.querySelectorAll('.student-checkbox');
        checkboxes.forEach(function(cb){
            cb.checked = selectAllCheckbox.checked;
        });
    };

    window.markAllPresent = function(){
        const checkboxes = document.querySelectorAll('.attendance-checkbox');
        checkboxes.forEach(function(cb){
            cb.checked = true;
            const label = cb.parentElement.querySelector('.toggle-label');
            if(label) label.textContent = 'Present';
        });
    };

    window.markAllAbsent = function(){
        const checkboxes = document.querySelectorAll('.attendance-checkbox');
        checkboxes.forEach(function(cb){
            cb.checked = false;
            const label = cb.parentElement.querySelector('.toggle-label');
            if(label) label.textContent = 'Absent';
        });
    };

    window.saveAttendance = function(){
        const attendance = [];
        const checkboxes = document.querySelectorAll('.attendance-checkbox');
        checkboxes.forEach(function(cb){
            attendance.push({
                studentId: cb.getAttribute('data-id'),
                present: cb.checked,
                date: (window.attendanceContextDate || new Date().toISOString().split('T')[0])
            });
        });
        const saveDate = (window.attendanceContextDate || new Date().toISOString().split('T')[0]);
        storage.set('attendance_' + saveDate, attendance);
        alert('Attendance saved successfully!');
    };

    window.updateAttendanceLabel = function(checkbox){
        const label = checkbox.parentElement.querySelector('.toggle-label');
        if(label){
            label.textContent = checkbox.checked ? 'Present' : 'Absent';
        }
    };

    // Removed edit attendance modal and functions per request

    // Classes and Sections Management
    if(page === 'classes'){
        // Initialize default classes data
        const defaultClasses = [
            { id: 'C1', name: 'Grade 8', sections: ['A', 'B', 'C'], sectionHead: 'Ms. Patel' }
        ];
        if(storage.get('classes') == null) storage.set('classes', defaultClasses);
        
        let classes = storage.get('classes', []);
        const tbody = document.querySelector('.table-card tbody');
        
        function renderClassesTable(){
            if(tbody){
                tbody.innerHTML = classes.map(function(c){
                    return '<tr data-class-id="'+c.id+'">'+
                        '<td>'+c.name+'</td>'+
                        '<td>'+c.sections.join(', ')+'</td>'+
                        '<td>'+c.sectionHead+'</td>'+
                        '<td>'+
                            '<button class="btn btn-sm btn-outline-primary me-1" onclick="editClass(\''+c.id+'\')" data-role-restricted="student,parent,teacher">Edit</button>'+
                            '<button class="btn btn-sm btn-outline-danger" onclick="deleteClass(\''+c.id+'\')" data-role-restricted="student,parent,teacher">Delete</button>'+
                        '</td>'+
                    '</tr>';
                }).join('') || '<tr><td colspan="4" class="text-center text-muted">No classes yet</td></tr>';
            }
        }
        
        function populateClassDropdown(){
            const classSelect = document.getElementById('sectionClass');
            if(classSelect){
                classSelect.innerHTML = '<option value="">Select a class</option>' + 
                    classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            }
        }
        
        renderClassesTable();
        populateClassDropdown();
        
        // Handle Add Class Form
        const addClassForm = document.getElementById('addClassForm');
        if(addClassForm){
            addClassForm.addEventListener('submit', function(e){
                e.preventDefault();
                const className = document.getElementById('className').value.trim();
                const sectionHead = document.getElementById('sectionHead').value.trim();
                
                if(!className){
                    alert('Please enter a class name.');
                    return;
                }
                
                // Check if class already exists
                if(classes.some(c => c.name.toLowerCase() === className.toLowerCase())){
                    alert('A class with this name already exists.');
                    return;
                }
                
                const newClass = {
                    id: 'C' + (classes.length + 1),
                    name: className,
                    sections: [],
                    sectionHead: sectionHead
                };
                
                classes.push(newClass);
                storage.set('classes', classes);
                renderClassesTable();
                populateClassDropdown();
                
                // Refresh all class dropdowns across the system
                populateClassDropdown('attendanceClass');
                populateClassDropdown('addStudentClass');
                populateClassDropdown('editStudentClass');
                populateClassDropdown('sectionClass');
                
                // Clear form and close modal
                addClassForm.reset();
                closeModal('modal-add-class');
                alert('Class added successfully. Redirecting back to Students page...');
                
                // Redirect back to students page with refresh parameter
                setTimeout(function() {
                    window.location.href = 'students.html?refresh=true';
                }, 1000);
            });
        }
        
        // Handle Add Section Form
        const addSectionForm = document.getElementById('addSectionForm');
        if(addSectionForm){
            addSectionForm.addEventListener('submit', function(e){
                e.preventDefault();
                const classId = document.getElementById('sectionClass').value;
                const sectionName = document.getElementById('sectionName').value.trim();
                
                if(!classId || !sectionName){
                    alert('Please select a class and enter a section name.');
                    return;
                }
                
                const classIndex = classes.findIndex(c => c.id === classId);
                if(classIndex !== -1){
                    // Check if section already exists in this class
                    if(classes[classIndex].sections.includes(sectionName)){
                        alert('This section already exists in the selected class.');
                        return;
                    }
                    
                    classes[classIndex].sections.push(sectionName);
                    storage.set('classes', classes);
                    renderClassesTable();
                    
                    // Refresh all dropdowns across the system
                    populateClassDropdown('attendanceClass');
                    populateClassDropdown('addStudentClass');
                    populateClassDropdown('editStudentClass');
                    populateClassDropdown('sectionClass');
                    
                    // Clear form and close modal
                    addSectionForm.reset();
                    populateClassDropdown();
                    closeModal('modal-add-section');
                    alert('Section added successfully. Redirecting back to Students page...');
                    
                    // Redirect back to students page with refresh parameter
                    setTimeout(function() {
                        window.location.href = 'students.html?refresh=true';
                    }, 1000);
                } else {
                    alert('Class not found.');
                }
            });
        }
        
        // Handle Edit Class Form
        const editClassForm = document.getElementById('editClassForm');
        if(editClassForm){
            editClassForm.addEventListener('submit', function(e){
                e.preventDefault();
                const classId = document.getElementById('editClassName').getAttribute('data-class-id');
                const sectionHead = document.getElementById('editSectionHead').value.trim();
                
                const classIndex = classes.findIndex(c => c.id === classId);
                if(classIndex !== -1){
                    classes[classIndex].sectionHead = sectionHead;
                    storage.set('classes', classes);
                    renderClassesTable();
                    closeModal('modal-edit-class');
                    alert('Class updated successfully.');
                }
            });
        }
        
        window.editClass = function(classId){
            const user = auth.getCurrent();
            if(['student', 'parent', 'teacher'].includes(user.role)){
                alert('Access denied. Only administrators can edit classes.');
                return;
            }
            
            const classData = classes.find(c => c.id === classId);
            if(!classData) return;
            
            document.getElementById('editClassName').value = classData.name;
            document.getElementById('editClassName').setAttribute('data-class-id', classId);
            document.getElementById('editSectionHead').value = classData.sectionHead;
            location.hash = 'modal-edit-class';
        };
        
        window.deleteClass = function(classId){
            const user = auth.getCurrent();
            if(['student', 'parent', 'teacher'].includes(user.role)){
                alert('Access denied. Only administrators can delete classes.');
                return;
            }
            
            const classData = classes.find(c => c.id === classId);
            if(!classData) return;
            
            if(confirm(`Are you sure you want to delete "${classData.name}"? This will also delete all sections in this class. This action cannot be undone.`)){
                classes = classes.filter(c => c.id !== classId);
                storage.set('classes', classes);
                renderClassesTable();
                populateClassDropdown();
                
                // Refresh all dropdowns across the system
                populateClassDropdown('attendanceClass');
                populateClassDropdown('addStudentClass');
                populateClassDropdown('editStudentClass');
                populateClassDropdown('sectionClass');
                
                alert('Class deleted successfully.');
            }
        };
        
        window.closeModal = function(modalId){
            location.hash = '';
        };
    }

    // Assignments Management
    if(page === 'assignments'){
        // Initialize default assignments data
        const defaultAssignments = [
            { id: 'A1', title: 'Algebra Worksheet', class: 'Grade 8', dueDate: '2025-09-30', submissions: 23, totalStudents: 30 }
        ];
        if(storage.get('assignments') == null) storage.set('assignments', defaultAssignments);
        
        const assignments = storage.get('assignments', []);
        const tbody = document.querySelector('.table-card tbody');
        
        let filteredAssignments = assignments;
        
        function renderAssignmentsTable(assignmentsToRender = filteredAssignments){
            if(tbody){
                tbody.innerHTML = assignmentsToRender.map(function(a){
                    return '<tr data-assignment-id="'+a.id+'">'+
                        '<td>'+a.title+'</td>'+
                        '<td>'+a.class+'</td>'+
                        '<td>'+a.dueDate+'</td>'+
                        '<td>'+a.submissions+'/'+a.totalStudents+'</td>'+
                        '<td class="edit-buttons">'+
                            '<button class="btn btn-sm btn-outline-primary me-1" onclick="viewAssignment(\''+a.id+'\')">View</button>'+
                            '<button class="btn btn-sm btn-outline-secondary me-1" onclick="editAssignment(\''+a.id+'\')" data-role-restricted="student,parent">Edit</button>'+
                            '<button class="btn btn-sm btn-outline-danger" onclick="deleteAssignment(\''+a.id+'\')" data-role-restricted="student,parent">Delete</button>'+
                        '</td>'+
                    '</tr>';
                }).join('') || '<tr><td colspan="5" class="text-center text-muted">No assignments found</td></tr>';
            }
        }
        
        renderAssignmentsTable();
        
        // Handle Create Assignment
        const createBtn = document.querySelector('a[href="#modal-add-assignment"]');
        if(createBtn){
            createBtn.addEventListener('click', function(e){
                e.preventDefault();
                const title = prompt('Enter assignment title:');
                const className = prompt('Enter class:');
                const dueDate = prompt('Enter due date (YYYY-MM-DD):');
                
                if(title && className && dueDate){
                    const newAssignment = {
                        id: 'A' + (assignments.length + 1),
                        title: title.trim(),
                        class: className.trim(),
                        dueDate: dueDate.trim(),
                        submissions: 0,
                        totalStudents: 30
                    };
                    assignments.push(newAssignment);
                    storage.set('assignments', assignments);
                    renderAssignmentsTable();
                    alert('Assignment created successfully.');
                }
            });
        }
        
        window.viewAssignment = function(assignmentId){
            const assignment = assignments.find(a => a.id === assignmentId);
            if(assignment){
                alert('Assignment: ' + assignment.title + '\nClass: ' + assignment.class + '\nDue: ' + assignment.dueDate + '\nSubmissions: ' + assignment.submissions + '/' + assignment.totalStudents);
            }
        };
        
        window.editAssignment = function(assignmentId){
            const user = auth.getCurrent();
            if(['student', 'parent'].includes(user.role)){
                alert('Access denied. Only teachers and administrators can edit assignments.');
                return;
            }
            
            const assignment = assignments.find(a => a.id === assignmentId);
            if(!assignment) return;
            
            const newTitle = prompt('Enter new title:', assignment.title);
            const newDueDate = prompt('Enter new due date (YYYY-MM-DD):', assignment.dueDate);
            
            if(newTitle !== null && newDueDate !== null){
                assignment.title = newTitle.trim();
                assignment.dueDate = newDueDate.trim();
                storage.set('assignments', assignments);
                renderAssignmentsTable();
                alert('Assignment updated successfully.');
            }
        };
        
        window.deleteAssignment = function(assignmentId){
            const user = auth.getCurrent();
            if(['student', 'parent'].includes(user.role)){
                alert('Access denied. Only teachers and administrators can delete assignments.');
                return;
            }
            
            if(confirm('Are you sure you want to delete this assignment? This action cannot be undone.')){
                const updatedAssignments = assignments.filter(a => a.id !== assignmentId);
                storage.set('assignments', updatedAssignments);
                renderAssignmentsTable();
                alert('Assignment deleted successfully.');
            }
        };
    }

    // Exams Management
    if(page === 'exams'){
        // Initialize default exams data
        const defaultExams = [
            { id: 'E1', title: 'Term 1', class: 'Grade 8', date: '2025-10-10' }
        ];
        if(storage.get('exams') == null) storage.set('exams', defaultExams);
        
        const exams = storage.get('exams', []);
        const tbody = document.querySelector('.table-card tbody');
        
        function renderExamsTable(){
            if(tbody){
                tbody.innerHTML = exams.map(function(e){
                    return '<tr data-exam-id="'+e.id+'">'+
                        '<td>'+e.title+'</td>'+
                        '<td>'+e.class+'</td>'+
                        '<td>'+e.date+'</td>'+
                        '<td>'+
                            '<button class="btn btn-sm btn-outline-primary me-1" onclick="viewExam(\''+e.id+'\')">View</button>'+
                            '<button class="btn btn-sm btn-outline-secondary me-1" onclick="editExam(\''+e.id+'\')" data-role-restricted="student,parent">Edit</button>'+
                            '<button class="btn btn-sm btn-outline-danger" onclick="deleteExam(\''+e.id+'\')" data-role-restricted="student,parent">Delete</button>'+
                        '</td>'+
                    '</tr>';
                }).join('') || '<tr><td colspan="4" class="text-center text-muted">No exams scheduled yet</td></tr>';
            }
        }
        
        renderExamsTable();
        
        // Handle Schedule Exam
        const scheduleBtn = document.querySelector('a[href="#modal-schedule-exam"]');
        if(scheduleBtn){
            scheduleBtn.addEventListener('click', function(e){
                e.preventDefault();
                const title = prompt('Enter exam title:');
                const className = prompt('Enter class:');
                const date = prompt('Enter exam date (YYYY-MM-DD):');
                
                if(title && className && date){
                    const newExam = {
                        id: 'E' + (exams.length + 1),
                        title: title.trim(),
                        class: className.trim(),
                        date: date.trim()
                    };
                    exams.push(newExam);
                    storage.set('exams', exams);
                    renderExamsTable();
                    alert('Exam scheduled successfully.');
                }
            });
        }
        
        window.viewExam = function(examId){
            const exam = exams.find(e => e.id === examId);
            if(exam){
                alert('Exam: ' + exam.title + '\nClass: ' + exam.class + '\nDate: ' + exam.date);
            }
        };
        
        window.editExam = function(examId){
            const user = auth.getCurrent();
            if(['student', 'parent'].includes(user.role)){
                alert('Access denied. Only teachers and administrators can edit exams.');
                return;
            }
            
            const exam = exams.find(e => e.id === examId);
            if(!exam) return;
            
            const newDate = prompt('Enter new exam date (YYYY-MM-DD):', exam.date);
            
            if(newDate !== null){
                exam.date = newDate.trim();
                storage.set('exams', exams);
                renderExamsTable();
                alert('Exam updated successfully.');
            }
        };
        
        window.deleteExam = function(examId){
            const user = auth.getCurrent();
            if(['student', 'parent'].includes(user.role)){
                alert('Access denied. Only teachers and administrators can delete exams.');
                return;
            }
            
            if(confirm('Are you sure you want to delete this exam? This action cannot be undone.')){
                const updatedExams = exams.filter(e => e.id !== examId);
                storage.set('exams', updatedExams);
                renderExamsTable();
                alert('Exam deleted successfully.');
            }
        };
    }

    // Enhanced Reports with Data Management
    if(page === 'reports'){
        // Add data export/import functionality
        function exportData(){
            const allData = {
                students: storage.get('students', []),
                classes: storage.get('classes', []),
                assignments: storage.get('assignments', []),
                exams: storage.get('exams', []),
                attendance: {},
                exportDate: new Date().toISOString()
            };
            
            // Get all attendance records
            for(let i = 0; i < localStorage.length; i++){
                const key = localStorage.key(i);
                if(key.startsWith('attendance_')){
                    allData.attendance[key] = storage.get(key, []);
                }
            }
            
            const dataStr = JSON.stringify(allData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'school_data_' + new Date().toISOString().split('T')[0] + '.json';
            link.click();
            URL.revokeObjectURL(url);
        }
        
        function importData(){
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = function(e){
                const file = e.target.files[0];
                if(file){
                    const reader = new FileReader();
                    reader.onload = function(e){
                        try{
                            const data = JSON.parse(e.target.result);
                            if(confirm('This will replace all current data. Are you sure?')){
                                if(data.students) storage.set('students', data.students);
                                if(data.classes) storage.set('classes', data.classes);
                                if(data.assignments) storage.set('assignments', data.assignments);
                                if(data.exams) storage.set('exams', data.exams);
                                if(data.attendance){
                                    Object.keys(data.attendance).forEach(key => {
                                        storage.set(key, data.attendance[key]);
                                    });
                                }
                                alert('Data imported successfully! Please refresh the page.');
                            }
                        } catch(err){
                            alert('Invalid file format. Please select a valid JSON file.');
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        }
        
        // Add export/import buttons to reports page
        const reportsContent = document.querySelector('.content');
        if(reportsContent){
            const dataControls = document.createElement('div');
            dataControls.className = 'toolbar mb-3';
            dataControls.innerHTML = `
                <button class="btn btn-outline-primary" onclick="exportData()">Export Data</button>
                <button class="btn btn-outline-secondary" onclick="importData()">Import Data</button>
                <button class="btn btn-outline-success" onclick="refreshReports()">Refresh Reports</button>
            `;
            reportsContent.insertBefore(dataControls, reportsContent.firstChild);
        }
        
        window.exportData = exportData;
        window.importData = importData;
        window.refreshReports = function(){
            location.reload();
        };
        
        // Enhanced alerts table with editable data
        const alertsTbody = document.querySelector('.table-card tbody');
        if(alertsTbody){
            const alerts = [
                { id: 'A1', alert: 'Low Attendance (65%)', student: 'Priya N', date: '2025-09-17' },
                { id: 'A2', alert: 'Missing Assignment', student: 'John Lee', date: '2025-09-18' },
                { id: 'A3', alert: 'Upcoming Exam', student: 'Aisha Khan', date: '2025-09-20' }
            ];
            
            function renderAlertsTable(){
                alertsTbody.innerHTML = alerts.map(function(a){
                    return '<tr data-alert-id="'+a.id+'">'+
                        '<td>'+a.alert+'</td>'+
                        '<td><a href="student.html?id=S140">'+a.student+'</a></td>'+
                        '<td>'+a.date+'</td>'+
                        '<td class="edit-buttons">'+
                            '<button class="btn btn-sm btn-outline-primary me-1" onclick="viewAlert(\''+a.id+'\')">View</button>'+
                            '<button class="btn btn-sm btn-outline-secondary me-1" onclick="editAlert(\''+a.id+'\')">Edit</button>'+
                            '<button class="btn btn-sm btn-outline-danger" onclick="deleteAlert(\''+a.id+'\')">Dismiss</button>'+
                        '</td>'+
                    '</tr>';
                }).join('');
            }
            
            renderAlertsTable();
            
            window.viewAlert = function(alertId){
                const alert = alerts.find(a => a.id === alertId);
                if(alert){
                    alert('Alert: ' + alert.alert + '\nStudent: ' + alert.student + '\nDate: ' + alert.date);
                }
            };
            
            window.editAlert = function(alertId){
                const alert = alerts.find(a => a.id === alertId);
                if(alert){
                    const newAlert = prompt('Edit alert message:', alert.alert);
                    if(newAlert !== null){
                        alert.alert = newAlert.trim();
                        renderAlertsTable();
                    }
                }
            };
            
            window.deleteAlert = function(alertId){
                if(confirm('Are you sure you want to dismiss this alert?')){
                    const alertIndex = alerts.findIndex(a => a.id === alertId);
                    if(alertIndex !== -1){
                        alerts.splice(alertIndex, 1);
                        renderAlertsTable();
                    }
                }
            };
        }
    }
})();


