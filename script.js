const STORAGE_KEYS = {
  appointments: "drFarhanaAppointments",
  posts: "drFarhanaPosts",
  adminSession: "drFarhanaAdminSession"
};

const ADMIN_CREDENTIALS = {
  username: "doctor",
  password: "clinic2026"
};

const visitType = document.querySelector("#visitType");
const feeTotal = document.querySelector("#feeTotal");
const bookingForm = document.querySelector("#bookingForm");
const confirmation = document.querySelector("#confirmation");
const confirmationText = document.querySelector("#confirmationText");
const appointmentDate = document.querySelector("#appointmentDate");
const appointmentRows = document.querySelector("#appointmentRows");
const emptyAppointments = document.querySelector("#emptyAppointments");
const seedDemo = document.querySelector("#seedDemo");
const blogPostForm = document.querySelector("#blogPostForm");
const adminPosts = document.querySelector("#adminPosts");
const publicPosts = document.querySelector("#publicPosts");
const adminLogin = document.querySelector("#adminLogin");
const adminDashboard = document.querySelector("#adminDashboard");
const adminLoginForm = document.querySelector("#adminLoginForm");
const loginError = document.querySelector("#loginError");
const adminLogout = document.querySelector("#adminLogout");

const readStore = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

const writeStore = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const formatCurrency = (value) =>
  `BDT ${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(value)}`;

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${dateString}T00:00:00`));
};

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const isAdminAuthenticated = () => sessionStorage.getItem(STORAGE_KEYS.adminSession) === "unlocked";

const setAdminVisibility = () => {
  if (!adminLogin || !adminDashboard) return;

  const unlocked = isAdminAuthenticated();
  adminLogin.hidden = unlocked;
  adminDashboard.hidden = !unlocked;

  if (unlocked) {
    renderAppointments();
    renderAdminPosts();
  }
};

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(adminLoginForm);
    const username = String(formData.get("username")).trim();
    const password = String(formData.get("password"));

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      sessionStorage.setItem(STORAGE_KEYS.adminSession, "unlocked");
      adminLoginForm.reset();
      loginError.hidden = true;
      setAdminVisibility();
      return;
    }

    loginError.hidden = false;
  });
}

if (adminLogout) {
  adminLogout.addEventListener("click", () => {
    sessionStorage.removeItem(STORAGE_KEYS.adminSession);
    setAdminVisibility();
  });
}

if (appointmentDate) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  appointmentDate.min = tomorrow.toISOString().split("T")[0];
}

if (visitType && feeTotal) {
  const updateFee = () => {
    feeTotal.textContent = formatCurrency(Number(visitType.value));
  };

  visitType.addEventListener("change", updateFee);
  updateFee();
}

if (bookingForm) {
  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!bookingForm.reportValidity()) {
      return;
    }

    const formData = new FormData(bookingForm);
    const trxId = String(formData.get("bkashTrxId")).trim();

    if (!trxId) {
      alert("Please complete bKash payment and enter the transaction ID before booking.");
      return;
    }

    const visitLabel = visitType.options[visitType.selectedIndex].textContent.split(" - ")[0];
    const appointment = {
      id: `APT-${Date.now()}`,
      name: String(formData.get("name")).trim(),
      email: String(formData.get("email")).trim(),
      phone: String(formData.get("phone")).trim(),
      birthdate: formData.get("birthdate"),
      visit: visitLabel,
      date: formData.get("appointmentDate"),
      time: formData.get("appointmentTime"),
      reason: String(formData.get("reason")).trim(),
      notes: String(formData.get("notes")).trim(),
      fee: Number(formData.get("visitType")),
      bkashNumber: String(formData.get("bkashNumber")).trim(),
      bkashTrxId: trxId,
      status: "Pending review",
      createdAt: new Date().toISOString()
    };

    const appointments = readStore(STORAGE_KEYS.appointments);
    appointments.unshift(appointment);
    writeStore(STORAGE_KEYS.appointments, appointments);

    confirmationText.textContent = `${appointment.name}, your ${appointment.visit.toLowerCase()} request for ${formatDate(appointment.date)} at ${appointment.time} is reserved after ${formatCurrency(appointment.fee)} bKash advance payment. Transaction ID: ${appointment.bkashTrxId}.`;
    confirmation.hidden = false;
    bookingForm.reset();
    visitType.value = "500";
    feeTotal.textContent = formatCurrency(500);
    confirmation.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

const statusOptions = ["Pending review", "Confirmed", "Completed", "Cancelled"];

const renderAppointments = () => {
  if (!appointmentRows) return;

  const appointments = readStore(STORAGE_KEYS.appointments);
  appointmentRows.innerHTML = appointments.map((appointment) => `
    <tr>
      <td data-label="Patient">
        <strong>${escapeHtml(appointment.name)}</strong>
        <span>${escapeHtml(appointment.phone)}</span>
      </td>
      <td data-label="Visit">
        ${escapeHtml(appointment.visit)}
        <span>${escapeHtml(appointment.reason)}</span>
      </td>
      <td data-label="Date">
        ${formatDate(appointment.date)}
        <span>${escapeHtml(appointment.time)}</span>
      </td>
      <td data-label="bKash">
        ${formatCurrency(appointment.fee)}
        <span>${escapeHtml(appointment.bkashTrxId)}</span>
      </td>
      <td data-label="Status">
        <select data-status-id="${appointment.id}" aria-label="Status for ${escapeHtml(appointment.name)}">
          ${statusOptions.map((status) => `<option value="${status}" ${appointment.status === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </td>
      <td data-label="Action">
        <button class="button table-button" type="button" data-delete-appointment="${appointment.id}">Delete</button>
      </td>
    </tr>
  `).join("");

  emptyAppointments.hidden = appointments.length > 0;
};

if (appointmentRows) {
  appointmentRows.addEventListener("change", (event) => {
    if (!isAdminAuthenticated()) return;

    const id = event.target.dataset.statusId;
    if (!id) return;

    const appointments = readStore(STORAGE_KEYS.appointments).map((appointment) =>
      appointment.id === id ? { ...appointment, status: event.target.value } : appointment
    );
    writeStore(STORAGE_KEYS.appointments, appointments);
    renderAppointments();
  });

  appointmentRows.addEventListener("click", (event) => {
    if (!isAdminAuthenticated()) return;

    const id = event.target.dataset.deleteAppointment;
    if (!id) return;

    const appointments = readStore(STORAGE_KEYS.appointments).filter((appointment) => appointment.id !== id);
    writeStore(STORAGE_KEYS.appointments, appointments);
    renderAppointments();
  });
}

if (seedDemo) {
  seedDemo.addEventListener("click", () => {
    if (!isAdminAuthenticated()) return;

    const appointments = readStore(STORAGE_KEYS.appointments);
    appointments.unshift({
      id: `APT-${Date.now()}`,
      name: "Mahmud Hasan",
      email: "mahmud@example.com",
      phone: "01712345678",
      birthdate: "1990-03-14",
      visit: "General consultation",
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      time: "10:30 AM",
      reason: "Fever and body ache",
      notes: "Paid through bKash app.",
      fee: 800,
      bkashNumber: "01712345678",
      bkashTrxId: "BK9A7C5D21",
      status: "Pending review",
      createdAt: new Date().toISOString()
    });
    writeStore(STORAGE_KEYS.appointments, appointments);
    renderAppointments();
  });
}

const renderAdminPosts = () => {
  if (!adminPosts) return;

  const posts = readStore(STORAGE_KEYS.posts);
  adminPosts.innerHTML = posts.length
    ? posts.map((post) => `
      <article class="managed-post">
        <span>${escapeHtml(post.category)} - ${formatDate(post.date)}</span>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt)}</p>
        <button class="button table-button" type="button" data-delete-post="${post.id}">Delete post</button>
      </article>
    `).join("")
    : `<p class="empty-state">No custom posts yet. Publish one from the editor above.</p>`;
};

if (blogPostForm) {
  blogPostForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!isAdminAuthenticated()) return;

    if (!blogPostForm.reportValidity()) return;

    const formData = new FormData(blogPostForm);
    const posts = readStore(STORAGE_KEYS.posts);
    posts.unshift({
      id: `POST-${Date.now()}`,
      title: String(formData.get("title")).trim(),
      category: String(formData.get("category")).trim(),
      excerpt: String(formData.get("excerpt")).trim(),
      body: String(formData.get("body")).trim(),
      date: new Date().toISOString().split("T")[0]
    });

    writeStore(STORAGE_KEYS.posts, posts);
    blogPostForm.reset();
    renderAdminPosts();
  });
}

if (adminPosts) {
  adminPosts.addEventListener("click", (event) => {
    if (!isAdminAuthenticated()) return;

    const id = event.target.dataset.deletePost;
    if (!id) return;

    const posts = readStore(STORAGE_KEYS.posts).filter((post) => post.id !== id);
    writeStore(STORAGE_KEYS.posts, posts);
    renderAdminPosts();
  });
}

if (publicPosts) {
  const posts = readStore(STORAGE_KEYS.posts);
  publicPosts.innerHTML = posts.map((post) => `
    <article class="featured-post custom-post">
      <div class="post-body">
        <p class="eyebrow">${escapeHtml(post.category)} - ${formatDate(post.date)}</p>
        <h2>${escapeHtml(post.title)}</h2>
        <p>${escapeHtml(post.excerpt)}</p>
        ${escapeHtml(post.body).split("\n").filter(Boolean).map((paragraph) => `<p>${paragraph}</p>`).join("")}
      </div>
    </article>
  `).join("");
}

setAdminVisibility();
