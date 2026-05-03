const API_BASE = "/api/auth";
const MESSAGE_API = "/api/messages";
const SOCKET_URL = window.location.origin;

const onlineSeedUsers = ["mironshohDev", "mironshox", "javohir", "nodirbek"];

// Socket.IO connection
let socket = null;
function initSocket(userId) {
  socket = io(SOCKET_URL);
  
  // Send userId AND username to backend
  socket.emit('add-user', { 
    userId: userId,
    username: currentAccount?.username 
  });
  
  // IMPROVED: Handle incoming messages with sender info
  socket.on('msg-recieve', (data) => {
    // data = { from: senderUsername, msg: messageText }
    const senderUsername = data.from || data.sender;
    const messageText = data.msg || data.message;
    
    console.log(`Message received from ${senderUsername}: ${messageText}`);
    
    if (!chats[senderUsername]) {
      chats[senderUsername] = [];
    }
    
    chats[senderUsername].push({ side: "in", text: messageText });
    
    // If chat with this user is open, render immediately
    if (selectedContact === senderUsername) {
      renderMessages(selectedContact);
    } else {
      // If not, still save but show notification
      console.log(`New message from ${senderUsername} (not active)`);
    }
  });
  
  // Receive list of currently online users (usernames)
  socket.on('online-users-list', (users) => {
    onlineUsersList = users.filter(u => u !== currentAccount?.username);
    console.log('Online users:', onlineUsersList);
    renderOnlineUsersFromSocket();
  });
  
  // Listen for user online events
  socket.on('user-online', (data) => {
    const username = data.username;
    if (username !== currentAccount?.username && !onlineUsersList.includes(username)) {
      onlineUsersList.push(username);
      console.log(`${username} came online`);
      renderOnlineUsersFromSocket();
    }
  });
  
  // Listen for user offline events
  socket.on('user-offline', (data) => {
    const username = data.username;
    onlineUsersList = onlineUsersList.filter(u => u !== username);
    console.log(`${username} went offline`);
    renderOnlineUsersFromSocket();
  });
}

const chats = {
  mironshox: [
    { side: "out", text: "Hey" },
    { side: "in", text: "Hello Mironshoh" },
    { side: "in", text: "What are you doing ?" },
    { side: "in", text: "👍" },
    { side: "out", text: "Ok I'm fine" },
    { side: "out", text: "I'am coding" }
  ],
  mironshohDev: [
    { side: "in", text: "Assalomu alaykum" },
    { side: "out", text: "Va alaykum salom" },
    { side: "in", text: "Frontend ishlayaptimi?" }
  ]
};

const list = document.getElementById("contactList");
const messages = document.getElementById("messages");
const activeUser = document.getElementById("activeUser");
const profileName = document.getElementById("profileName");
const composer = document.getElementById("composer");
const messageInput = document.getElementById("messageInput");
const profileAvatar = document.getElementById("profileAvatar");
const avatarEditBtn = document.getElementById("avatarEditBtn");
const avatarModal = document.getElementById("avatarModal");
const avatarPicker = document.getElementById("avatarPicker");
const avatarModalClose = document.getElementById("avatarModalClose");

const authOverlay = document.getElementById("authOverlay");
const authShell = document.getElementById("authShell");
const authStatus = document.getElementById("authStatus");
const showLoginBtn = document.getElementById("showLogin");
const showRegisterBtn = document.getElementById("showRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const regUsername = document.getElementById("regUsername");
const regEmail = document.getElementById("regEmail");
const regPassword = document.getElementById("regPassword");

let selectedContact = null;
let currentAccount = null;
let onlineUsersList = [];

// Avatar emojis
const avatarEmojis = ["🙂", "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😌", "😔", "😑", "😐", "😶", "🙁", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤮", "🤢", "🤮", "🤮", "🤮"];

function renderAvatarPicker() {
  avatarPicker.innerHTML = "";
  const uniqueEmojis = [...new Set(avatarEmojis)];
  
  uniqueEmojis.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.className = "avatar-picker-btn";
    btn.textContent = emoji;
    btn.type = "button";
    btn.onclick = () => setUserAvatar(emoji);
    avatarPicker.appendChild(btn);
  });
}

async function setUserAvatar(avatarImage) {
  if (!currentAccount || !currentAccount._id) return;

  try {
    const response = await fetch(`${API_BASE}/setavatar/${currentAccount._id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: avatarImage })
    });

    const data = await response.json();
    if (data.isset) {
      currentAccount.avatarImage = avatarImage;
      profileAvatar.textContent = avatarImage;
      localStorage.setItem("mirchat-user", JSON.stringify(currentAccount));
      avatarModal.classList.add("hidden");
      console.log("Avatar updated!");
    }
  } catch (error) {
    console.error("Error setting avatar:", error);
  }
}

function setAuthView(mode) {
  const isLogin = mode === "login";
  authShell.classList.toggle("register-mode", !isLogin);
  loginForm.classList.toggle("hidden", !isLogin);
  registerForm.classList.toggle("hidden", isLogin);
  showLoginBtn.classList.toggle("hidden", isLogin);
  showRegisterBtn.classList.toggle("hidden", !isLogin);
  authStatus.textContent = "";
}

function activateContact(username) {
  list.querySelectorAll(".contact-item").forEach((item) => {
    item.classList.remove("active");
  });
  const currentContact = list.querySelector(`[data-user="${username}"]`);
  if (currentContact) {
    currentContact.classList.add("active");
  }
}

function buildOnlineUsers(selfUsername) {
  const users = Array.from(new Set([...onlineSeedUsers, "mironshohDev", "mironshox"]));
  return users.filter((user) => user !== selfUsername);
}

async function renderOnlineUsers(selfUsername) {
  let users = [];
  
  // Try to fetch users from backend
  try {
    if (currentAccount && currentAccount._id) {
      const response = await fetch(`${API_BASE}/allusers/${currentAccount._id}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        users = data.map(u => u.username);
      }
    }
  } catch (error) {
    console.error("Could not fetch users from backend, using seed data:", error);
    users = buildOnlineUsers(selfUsername);
  }

  if (users.length === 0) {
    users = buildOnlineUsers(selfUsername);
  }

  list.innerHTML = "";

  users.forEach((userObj) => {
    const username = typeof userObj === 'string' ? userObj : userObj.username;
    const item = document.createElement("li");
    item.className = "contact-item";
    item.dataset.user = username;
    item.innerHTML = `
      <span class="avatar avatar-2">🧑</span>
      <div>
        <p class="contact-name">${username}</p>
        <p class="contact-status">online</p>
      </div>
    `;
    list.appendChild(item);
  });

  if (users.length > 0) {
    const firstUser = typeof users[0] === 'string' ? users[0] : users[0].username;
    selectedContact = firstUser;
    activeUser.textContent = selectedContact;
    activateContact(selectedContact);
    renderMessages(selectedContact);
  } else {
    selectedContact = null;
    activeUser.textContent = "No users online";
    messages.innerHTML = "<div class=\"bubble in\">Hozircha online user yo'q.</div>";
  }
}

function renderOnlineUsersFromSocket() {
  if (!onlineUsersList || onlineUsersList.length === 0) {
    list.innerHTML = "";
    selectedContact = null;
    activeUser.textContent = "No users online";
    messages.innerHTML = "<div class=\"bubble in\">Hozircha online user yo'q.</div>";
    return;
  }

  list.innerHTML = "";

  onlineUsersList.forEach((username) => {
    const item = document.createElement("li");
    item.className = "contact-item";
    item.dataset.user = username;
    item.innerHTML = `
      <span class="avatar avatar-2">🧑</span>
      <div>
        <p class="contact-name">${username}</p>
        <p class="contact-status">online</p>
      </div>
    `;
    list.appendChild(item);
  });

  if (onlineUsersList.length > 0 && !selectedContact) {
    selectedContact = onlineUsersList[0];
    activeUser.textContent = selectedContact;
    activateContact(selectedContact);
    renderMessages(selectedContact);
  }
}

function onAuthSuccess(user, source) {
  const username = user?.username || "user";
  currentAccount = user;
  localStorage.setItem("mirchat-user", JSON.stringify(user));

  profileName.textContent = username;
  
  // Set avatar
  const avatar = user?.avatarImage || "🙂";
  profileAvatar.textContent = avatar;

  // Initialize Socket.IO when user logs in
  if (user._id) {
    initSocket(user._id);
  }

  renderOnlineUsers(username);
  if (selectedContact && !chats[selectedContact]) {
    chats[selectedContact] = [{ side: "in", text: `${source} successful. Boshladik!` }];
    renderMessages(selectedContact);
  }

  authOverlay.classList.add("hidden");
}

async function callAuth(endpoint, payload) {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

function renderMessages(user) {
  messages.innerHTML = "";
  const thread = chats[user] || [];
  thread.forEach((item) => {
    const bubble = document.createElement("div");
    bubble.className = `bubble ${item.side === "out" ? "out" : "in"}`;
    bubble.textContent = item.text;
    messages.appendChild(bubble);
  });
  messages.scrollTop = messages.scrollHeight;
}

list.addEventListener("click", (event) => {
  const contact = event.target.closest(".contact-item");
  if (!contact) return;

  list.querySelectorAll(".contact-item").forEach((item) => {
    item.classList.remove("active");
  });

  contact.classList.add("active");
  selectedContact = contact.dataset.user;
  activeUser.textContent = selectedContact;
  renderMessages(selectedContact);
});

composer.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = messageInput.value.trim();
  if (!value || !selectedContact || !currentAccount) return;

  if (!chats[selectedContact]) {
    chats[selectedContact] = [];
  }

  // Add message to local chat
  chats[selectedContact].push({ side: "out", text: value });
  renderMessages(selectedContact);
  messageInput.value = "";

  // Send to backend API
  try {
    await fetch(MESSAGE_API + "/addmsg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: currentAccount._id,
        to: selectedContact,
        message: value
      })
    });

    // Emit through Socket.IO for real-time delivery
    if (socket) {
      socket.emit('send-msg', {
        from: currentAccount?.username,  // ADD: sender username
        to: selectedContact,
        msg: value
      });
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
});

showLoginBtn.addEventListener("click", () => setAuthView("login"));
showRegisterBtn.addEventListener("click", () => setAuthView("register"));

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = loginUsername.value.trim();
  const password = loginPassword.value.trim();
  if (!username || !password) return;

  authStatus.textContent = "Logging in...";
  try {
    const data = await callAuth("login", { username, password });
    if (data?.status) {
      onAuthSuccess(data.user, "Login");
      loginForm.reset();
      return;
    }
    authStatus.textContent = data?.msg || "Login failed";
  } catch (error) {
    authStatus.textContent = "Backend not reachable. Check server and CORS.";
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = regUsername.value.trim();
  const email = regEmail.value.trim();
  const password = regPassword.value.trim();

  if (!username || !email || !password) return;

  authStatus.textContent = "Creating account...";
  try {
    const data = await callAuth("register", { username, email, password });
    if (data?.status) {
      onAuthSuccess(data.user, "Register");
      registerForm.reset();
      return;
    }
    authStatus.textContent = data?.msg || "Register failed";
  } catch (error) {
    authStatus.textContent = "Backend not reachable. Check server and CORS.";
  }
});

const savedUser = localStorage.getItem("mirchat-user");
if (savedUser) {
  try {
    onAuthSuccess(JSON.parse(savedUser), "Login");
  } catch {
    localStorage.removeItem("mirchat-user");
    setAuthView("login");
  }
} else {
  setAuthView("login");
}

// Logout handler
const powerBtn = document.querySelector(".power-btn");
if (powerBtn) {
  powerBtn.addEventListener("click", async () => {
    if (!currentAccount) return;
    
    try {
      await fetch(`${API_BASE}/logout/${currentAccount._id}`, {
        method: "GET"
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    currentAccount = null;
    localStorage.removeItem("mirchat-user");
    if (socket) socket.disconnect();
    authOverlay.classList.remove("hidden");
    setAuthView("login");
    chats = {};
  });
}

// Avatar edit handler
avatarEditBtn.addEventListener("click", () => {
  if (!currentAccount) return;
  renderAvatarPicker();
  avatarModal.classList.remove("hidden");
});

avatarModalClose.addEventListener("click", () => {
  avatarModal.classList.add("hidden");
});

// Close modal when clicking outside
avatarModal.addEventListener("click", (e) => {
  if (e.target === avatarModal) {
    avatarModal.classList.add("hidden");
  }
});
