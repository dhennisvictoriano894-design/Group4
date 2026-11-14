
// ======================================
// ATTENDEASE - SMART ATTENDANCE SYSTEM
// ======================================

// Demo accounts
const ADMIN = {
    username: "admin",
    password: "admin123",
    role: "admin",
    name: "Administrator"
};

// Default student data
const defaultStudents = [
    {
        id: "STU001",
        name: "Juan Dela Cruz",
        username: "student",
        password: "student123"
    },
    {
        id: "STU002",
        name: "Maria Santos",
        username: "maria",
        password: "maria123"
    },
    {
        id: "STU003",
        name: "Pedro Reyes",
        username: "pedro",
        password: "pedro123"
    }
];

// ======================================
// LOCAL STORAGE
// ======================================

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
        console.error("Could not load saved data:", error);
        return fallback;
    }
}

let students = loadData("attendEaseStudents", defaultStudents);
let records = loadData("attendEaseRecords", []);
let currentUser = null;
let currentReport = [];

// Save data
function saveData() {
    localStorage.setItem("attendEaseStudents",
        JSON.stringify(students));

    localStorage.setItem("attendEaseRecords",
        JSON.stringify(records));
}

// ======================================
// HELPER FUNCTIONS
// ======================================

const $ = id => document.getElementById(id);

function getToday() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000)
        .toISOString().split("T")[0];
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function getStudent(id) {
    return students.find(student => student.id === id);
}

function showMessage(elementId, message, success = true) {
    const element = $(elementId);
    element.textContent = message;
    element.style.color = success ? "#15803d" : "#dc2626";
}

function isAdmin() {
    return currentUser && currentUser.role === "admin";
}

// ======================================
// LOGIN
// ======================================

$("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const username = $("username").value.trim();
    const password = $("password").value;
    const role = $("role").value;

    let account = null;

    if (role === "admin") {
        if (username === ADMIN.username &&
            password === ADMIN.password) {
            account = ADMIN;
        }
    } else {
        account = students.find(student =>
            student.username === username &&
            student.password === password
        );

        if (account) {
            account = {
                ...account,
                role: "student"
            };
        }
    }

    if (!account) {
        $("loginError").textContent =
            "Invalid username, password, or account type.";
        return;
    }

    currentUser = account;

    $("loginError").textContent = "";
    $("loginPage").classList.add("hidden");
    $("appPage").classList.remove("hidden");

    $("welcomeUser").textContent =
        "Welcome, " + currentUser.name;

    setupDashboard();
});

// ======================================
// LOGOUT
// ======================================

$("logoutBtn").addEventListener("click", function() {
    currentUser = null;

    $("appPage").classList.add("hidden");
    $("loginPage").classList.remove("hidden");

    $("loginForm").reset();
    $("loginError").textContent = "";
});

// ======================================
// DASHBOARD SETUP
// ======================================

function setupDashboard() {
    const adminElements =
        document.querySelectorAll(".admin-only");

    adminElements.forEach(element => {
        element.classList.toggle("hidden", !isAdmin());
    });

    $("studentWelcome").classList.toggle("hidden", isAdmin());

    $("todayDate").textContent =
        new Date().toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

    $("attendanceDate").value = getToday();
    $("filterDate").value = getToday();
    $("reportDate").value = getToday();

    showSection("dashboard");
    refreshAll();
}

// ======================================
// NAVIGATION
// ======================================

document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", function() {
        if (!currentUser) return;

        const section = this.dataset.section;

        if (!isAdmin() &&
            ["students", "attendance"].includes(section)) {
            return;
        }

        showSection(section);
    });
});

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(section => {
        section.classList.add("hidden");
    });

    const target = $(sectionId);
    if (target) target.classList.remove("hidden");

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.section === sectionId
        );
    });

    refreshAll();
}

// ======================================
// REFRESH ALL DATA
// ======================================

function refreshAll() {
    if (!currentUser) return;

    renderRecentRecords();
    renderStudentTable();
    renderStudentOptions();
    renderAttendanceTable();
    renderReport();

    if (isAdmin()) {
        updateAdminStats();
    } else {
        updateStudentDashboard();
    }
}

// ======================================
// ADMIN STATISTICS
// ======================================

function updateAdminStats() {
    const todayRecords = records.filter(
        record => record.date === getToday()
    );

    const present = todayRecords.filter(
        record => record.status === "Present"
    ).length;

    const absent = todayRecords.filter(
        record => record.status === "Absent"
    ).length;

    const late = todayRecords.filter(
        record => record.status === "Late"
    ).length;

    const rate = students.length
        ? Math.round((present + late) / students.length * 100)
        : 0;

    $("totalStudents").textContent = students.length;
    $("totalPresent").textContent = present + late;
    $("totalAbsent").textContent =
        Math.max(0, students.length - present - late);

    $("attendanceRate").textContent = rate + "%";
}

// ======================================
// STUDENT DASHBOARD
// ======================================

function updateStudentDashboard() {
    const myRecords = records.filter(
        record => record.studentId === currentUser.id
    );

    const present = myRecords.filter(
        record => record.status === "Present"
    ).length;

    const late = myRecords.filter(
        record => record.status === "Late"
    ).length;

    const absent = myRecords.filter(
        record => record.status === "Absent"
    ).length;

    const rate = myRecords.length
        ? Math.round((present + late) / myRecords.length * 100)
        : 0;

    $("studentName").textContent =
        currentUser.name + " (" + currentUser.id + ")";

    $("myPresent").textContent = present + late;
    $("myAbsent").textContent = absent;
    $("myRate").textContent = rate + "%";

    const alreadyMarked = myRecords.some(
        record => record.date === getToday()
    );

    $("markMyAttendance").disabled = alreadyMarked;
    $("markMyAttendance").textContent =
        alreadyMarked ? "Attendance Already Recorded" :
        "Mark My Attendance";

    $("markMyAttendance").style.opacity =
        alreadyMarked ? "0.6" : "1";

    $("studentAttendanceMessage").textContent =
        alreadyMarked
        ? "Your attendance for today has already been recorded."
        : "You have not recorded your attendance today.";
}

// ======================================
// STUDENT SELF ATTENDANCE
// ======================================

$("markMyAttendance").addEventListener("click", function() {
    if (!currentUser || isAdmin()) return;

    const alreadyMarked = records.some(record =>
        record.studentId === currentUser.id &&
        record.date === getToday()
    );

    if (alreadyMarked) {
        showMessage(
            "studentAttendanceMessage",
            "Attendance already recorded.",
            false
        );
        return;
    }

    records.push({
        studentId: currentUser.id,
        date: getToday(),
        status: "Present"
    });

    saveData();
    refreshAll();

    showMessage(
        "studentAttendanceMessage",
        "Attendance successfully recorded!"
    );
});

// ======================================
// ADD STUDENT
// ======================================

$("studentForm").addEventListener("submit", function(event) {
    event.preventDefault();

    if (!isAdmin()) return;

    const id = $("newStudentId").value.trim();
    const name = $("newStudentName").value.trim();
    const username = $("newStudentUsername").value.trim();
    const password = $("newStudentPassword").value;

    if (students.some(student =>
        student.id.toLowerCase() === id.toLowerCase() ||
        student.username.toLowerCase() === username.toLowerCase()
    )) {
        showMessage(
            "studentMessage",
            "Student ID or username already exists.",
            false
        );
        return;
    }

    students.push({
        id,
        name,
        username,
        password
    });

    saveData();
    this.reset();
    refreshAll();

    showMessage(
        "studentMessage",
        "Student successfully added!"
    );
});

// ======================================
// STUDENT LIST
// ======================================

function renderStudentTable() {
    if (!isAdmin()) return;

    const search = $("studentSearch").value.toLowerCase();

    const filtered = students.filter(student =>
        student.name.toLowerCase().includes(search) ||
        student.id.toLowerCase().includes(search) ||
        student.username.toLowerCase().includes(search)
    );

    $("studentTable").innerHTML = filtered.map(student => `
        <tr>
            <td>${escapeHTML(student.id)}</td>
            <td>${escapeHTML(student.name)}</td>
            <td>${escapeHTML(student.username)}</td>
            <td>
                <button class="delete-btn"
                    data-delete-student="${escapeHTML(student.id)}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("") || `
        <tr><td colspan="4">No students found.</td></tr>
    `;
}

$("studentSearch").addEventListener("input", renderStudentTable);

// Delete student
$("studentTable").addEventListener("click", function(event) {
    const button = event.target.closest("[data-delete-student]");
    if (!button || !isAdmin()) return;

    const id = button.dataset.deleteStudent;

    if (!confirm("Delete this student and their attendance records?")) {
        return;
    }

    students = students.filter(student => student.id !== id);
    records = records.filter(record => record.studentId !== id);

    saveData();
    refreshAll();

    showMessage("studentMessage", "Student deleted successfully.");
});

// ======================================
// STUDENT DROPDOWN
// ======================================

function renderStudentOptions() {
    if (!isAdmin()) return;

    const select = $("attendanceStudent");
    const selected = select.value;

    select.innerHTML =
        '<option value="">Select Student</option>' +
        students.map(student => `
            <option value="${escapeHTML(student.id)}">
                ${escapeHTML(student.id)} - ${escapeHTML(student.name)}
            </option>
        `).join("");

    if (students.some(student => student.id === selected)) {
        select.value = selected;
    }
}

// ======================================
// RECORD ATTENDANCE
// ======================================

$("attendanceForm").addEventListener("submit", function(event) {
    event.preventDefault();

    if (!isAdmin()) return;

    const studentId = $("attendanceStudent").value;
    const date = $("attendanceDate").value;
    const status = $("attendanceStatus").value;

    if (!getStudent(studentId)) {
        showMessage("attendanceMessage",
            "Please select a valid student.", false);
        return;
    }

    if (!date || date > getToday()) {
        showMessage("attendanceMessage",
            "Please select a valid date (not in the future).",
            false);
        return;
    }

    const existing = records.find(record =>
        record.studentId === studentId &&
        record.date === date
    );

    if (existing) {
        existing.status = status;
        showMessage("attendanceMessage",
            "Existing attendance record updated!");
    } else {
        records.push({
            studentId,
            date,
            status
        });

        showMessage("attendanceMessage",
            "Attendance successfully saved!");
    }

    saveData();
    refreshAll();
});

// ======================================
// ATTENDANCE TABLE
// ======================================

function renderAttendanceTable() {
    if (!isAdmin()) return;

    const filter = $("filterDate").value;

    let filtered = [...records];

    if (filter) {
        filtered = filtered.filter(
            record => record.date === filter
        );
    }

    filtered.sort((a, b) =>
        b.date.localeCompare(a.date)
    );

    $("attendanceTable").innerHTML = filtered.map(record => {
        const student = getStudent(record.studentId);
        if (!student) return "";

        return `
            <tr>
                <td>${escapeHTML(student.id)}</td>
                <td>${escapeHTML(student.name)}</td>
                <td>${escapeHTML(record.date)}</td>
                <td>
                    <span class="status ${escapeHTML(record.status)}">
                        ${escapeHTML(record.status)}
                    </span>
                </td>
                <td>
                    <button class="delete-btn"
                        data-delete-record="${escapeHTML(record.studentId)}|${escapeHTML(record.date)}">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join("") || `
        <tr><td colspan="5">No attendance records found.</td></tr>
    `;
}

$("filterDate").addEventListener("change", renderAttendanceTable);

$("clearFilter").addEventListener("click", function() {
    $("filterDate").value = "";
    renderAttendanceTable();
});

// Delete attendance record
$("attendanceTable").addEventListener("click", function(event) {
    const button = event.target.closest("[data-delete-record]");
    if (!button || !isAdmin()) return;

    const [id, date] = button.dataset.deleteRecord.split("|");

    if (!confirm("Delete this attendance record?")) return;

    records = records.filter(record =>
        !(record.studentId === id && record.date === date)
    );

    saveData();
    refreshAll();
    showMessage("attendanceMessage", "Record deleted.");
});

// ======================================
// RECENT ATTENDANCE
// ======================================

function renderRecentRecords() {
    let recent = [...records];

    if (!isAdmin()) {
        recent = recent.filter(
            record => record.studentId === currentUser.id
        );
    }

    recent.sort((a, b) => b.date.localeCompare(a.date));

    $("recentRecords").innerHTML = recent.slice(0, 5).map(record => {
        const student = getStudent(record.studentId);
        if (!student) return "";

        return `
            <tr>
                <td>${escapeHTML(student.id)}</td>
                <td>${escapeHTML(student.name)}</td>
                <td>${escapeHTML(record.date)}</td>
                <td>
                    <span class="status ${escapeHTML(record.status)}">
                        ${escapeHTML(record.status)}
                    </span>
                </td>
            </tr>
        `;
    }).join("") || `
        <tr><td colspan="4">No attendance records yet.</td></tr>
    `;
}

// ======================================
// REPORT GENERATION
// ======================================

function renderReport() {
    if (!currentUser) return;

    const date = $("reportDate").value;

    currentReport = records.filter(record => {
        const matchesDate = !date || record.date === date;

        const matchesUser = isAdmin() ||
            record.studentId === currentUser.id;

        return matchesDate && matchesUser;
    });

    $("reportTable").innerHTML = currentReport.map(record => {
        const student = getStudent(record.studentId);
        if (!student) return "";

        return `
            <tr>
                <td>${escapeHTML(student.id)}</td>
                <td>${escapeHTML(student.name)}</td>
                <td>${escapeHTML(record.date)}</td>
                <td>
                    <span class="status ${escapeHTML(record.status)}">
                        ${escapeHTML(record.status)}
                    </span>
                </td>
            </tr>
        `;
    }).join("") || `
        <tr><td colspan="4">No report records found.</td></tr>
    `;
}

$("generateReport").addEventListener("click", renderReport);

$("reportDate").addEventListener("change", renderReport);

// ======================================
// EXPORT CSV
// ======================================

$("exportReport").addEventListener("click", function() {
    if (!currentUser) return;

    renderReport();

    if (currentReport.length === 0) {
        alert("There are no records to export.");
        return;
    }

    const rows = [
        ["Student ID", "Student Name", "Date", "Status"]
    ];

    currentReport.forEach(record => {
        const student = getStudent(record.studentId);

        if (student) {
            rows.push([
                student.id,
                student.name,
                record.date,
                record.status
            ]);
        }
    });

    const csv = rows.map(row =>
        row.map(value =>
            '"' + String(value).replace(/"/g, '""') + '"'
        ).join(",")
    ).join("\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Attendance_Report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
});
