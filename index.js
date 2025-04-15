// Check if user is logged in
document.addEventListener("DOMContentLoaded", function () {
  // Check authentication status
  checkAuthStatus();

  // Load all posts
  loadPosts();

  // Add event listener for post button
  document.getElementById("postButton").addEventListener("click", createPost);
});

// Function to check authentication status and update UI
function checkAuthStatus() {
  const userData = localStorage.getItem("user");
  const postBox = document.getElementById("post-box");

  if (userData) {
    const user = JSON.parse(userData);

    // Update navigation for logged-in users
    const navMenu = document.getElementById("navMenu");
    if (navMenu.innerHTML.includes('<a href="Login.html">Login</a>')) {
      navMenu.innerHTML = navMenu.innerHTML.replace(
        '<a href="Login.html">Login</a>',
        `<a href="profile.html" class="profile-icon-link">
                <img src="${
                  user.profilePicture || "https://via.placeholder.com/40"
                }" alt="Profile" class="nav-profile-pic">
               </a>
               <a href="#" id="logoutBtn">LOGOUT</a>`
      );

      // Add logout functionality
      document
        .getElementById("logoutBtn")
        .addEventListener("click", function (e) {
          e.preventDefault();
          localStorage.removeItem("user");
          window.location.reload();
        });
    }

    // Show post box for logged-in users
    postBox.style.display = "block";

    // Update placeholder with user's name
    document.getElementById(
      "postInput"
    ).placeholder = `What's on your mind, ${user.name}?`;
  } else {
    // Hide post box for logged-out users
    postBox.style.display = "none";

    // Add login prompt before the feed
    const main = document.querySelector("main");
    const feedElement = document.getElementById("feed");

    // Only add the login prompt if it doesn't already exist
    if (!document.getElementById("login-prompt")) {
      const loginPrompt = document.createElement("div");
      loginPrompt.id = "login-prompt";
      loginPrompt.className = "post-box";
      loginPrompt.style.textAlign = "center";
      loginPrompt.innerHTML = `
              <h3>Welcome to socioGen!</h3>
              <p>Log in to create posts and interact with other users.</p>
              <a href="Login.html" style="display: inline-block; margin: 10px 0; padding: 8px 16px; background-color: var(--primary-color); color: white; border-radius: 4px; text-decoration: none;">Login</a>
              <a href="Register.html" style="display: inline-block; margin: 10px 0 10px 10px; padding: 8px 16px; background-color: #888; color: white; border-radius: 4px; text-decoration: none;">Register</a>
            `;

      main.insertBefore(loginPrompt, feedElement);
    }
  }
}

// Function to load posts from the server
async function loadPosts() {
  try {
    const response = await fetch("http://localhost:3000/api/posts");
    const posts = await response.json();

    const feedContainer = document.getElementById("feed");
    // Remove loading indicator
    document.getElementById("loading-indicator").remove();

    // If no posts
    if (posts.length === 0) {
      feedContainer.innerHTML = `
              <div style="text-align: center; padding: 20px;">
                <p>No posts yet. Be the first to post something!</p>
              </div>
            `;
      return;
    }

    // Clear existing posts
    feedContainer.innerHTML = "";

    // Render each post
    posts.forEach((post) => {
      const postElement = createPostElement(post);
      feedContainer.appendChild(postElement);
    });
  } catch (error) {
    console.error("Error loading posts:", error);
    document.getElementById("feed").innerHTML = `
            <div style="text-align: center; padding: 20px;">
              <p>Error loading posts. Please try again later.</p>
            </div>
          `;
  }
}

// Function to create a post element
function createPostElement(post) {
  const postDiv = document.createElement("div");
  postDiv.className = "post";
  postDiv.setAttribute("data-post-id", post._id);

  // Format date
  const date = new Date(post.date);
  const formattedDate =
    date.toLocaleDateString() +
    " at " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Check if current user has liked this post
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const isLiked =
    post.likes && post.likes.some((like) => like.user === currentUser.id);
  const likeButtonClass = isLiked ? "liked" : "";
  const heartIcon = isLiked ? "fas" : "far";
  const likeText = isLiked ? "Liked" : "Like";

  // User info
  const userName = post.user ? post.user.name : "User";
  const userProfilePic =
    post.user && post.user.profilePicture
      ? post.user.profilePicture
      : "https://via.placeholder.com/40";

  let imageHtml = "";
  if (post.image) {
    imageHtml = `
            <div class="post-image-container">
              <img src="${post.image}" alt="Post image" class="post-image" onclick="viewFullImage('${post.image}')">
            </div>
          `;
  }

  postDiv.innerHTML = `
          <div class="post-header">
            <img src="${userProfilePic}" alt="${userName}" class="post-avatar">
            <div class="post-header-info">
              <h3>${userName}</h3>
              <span class="post-date">${formattedDate}</span>
            </div>
          </div>
          <div class="post-content">
            ${post.text ? `<p class="post-text">${post.text}</p>` : ""}
            ${imageHtml}
          </div>
          <div class="post-actions">
            <button onclick="likePost(this, '${
              post._id
            }')" class="${likeButtonClass}">
              <i class="${heartIcon} fa-heart"></i> ${likeText}
            </button>
            <button onclick="toggleComments('${post._id}')">
              <i class="far fa-comment"></i> Comments (${
                post.comments ? post.comments.length : 0
              })
            </button>
            <button onclick="sharePost('${post._id}')">
              <i class="fas fa-share"></i> Share
            </button>
          </div>
          <div class="comments-section" id="comments-${
            post._id
          }" style="display: none; margin-top: 15px;">
            <div class="comments-list">
              ${
                (post.comments &&
                  post.comments
                    .map((comment) => {
                      const commentDate = new Date(comment.date);
                      const formattedCommentDate =
                        commentDate.toLocaleDateString();
                      const commentUser =
                        comment.user && comment.user.name
                          ? comment.user.name
                          : "User";
                      const commentUserPic =
                        comment.user && comment.user.profilePicture
                          ? comment.user.profilePicture
                          : "https://via.placeholder.com/30";
                      return `
                  <div class="comment">
                    <img src="${commentUserPic}" alt="${commentUser}" class="comment-avatar">
                    <div class="comment-content">
                      <div class="comment-header">
                        <strong>${commentUser}</strong>
                        <span class="comment-date">${formattedCommentDate}</span>
                      </div>
                      <p class="comment-text">${comment.text}</p>
                    </div>
                  </div>
                `;
                    })
                    .join("")) ||
                ""
              }
            </div>
            <div class="add-comment">
              <textarea id="comment-text-${
                post._id
              }" placeholder="Write a comment..." class="comment-input"></textarea>
              <button onclick="addComment('${
                post._id
              }')" class="comment-btn">Comment</button>
            </div>
          </div>
        `;

  return postDiv;
}

// Add this to handle image uploads in posts
let postImageData = null;

// Function to compress an image
async function compressImage(imageDataUrl, quality = 0.7, maxWidth = 1200) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function () {
      // Create canvas
      const canvas = document.createElement("canvas");

      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = height * (maxWidth / width);
        width = maxWidth;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to data URL with reduced quality
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);

      // Log size reduction
      console.log(`Original size: ${imageDataUrl.length} bytes`);
      console.log(`Compressed size: ${compressedDataUrl.length} bytes`);
      console.log(
        `Compression ratio: ${(
          (compressedDataUrl.length / imageDataUrl.length) *
          100
        ).toFixed(2)}%`
      );

      resolve(compressedDataUrl);
    };

    img.src = imageDataUrl;
  });
}

// Updated image upload handling
document.addEventListener("DOMContentLoaded", function () {
  // Image upload handling
  const imageUploadInput = document.getElementById("post-image-upload");
  const imagePreviewContainer = document.getElementById(
    "image-preview-container"
  );
  const imagePreview = document.getElementById("image-preview");
  const removeImageBtn = document.getElementById("remove-image");

  imageUploadInput.addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (file) {
      // Check file size
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        alert("File is too large. Please select an image under 10MB.");
        imageUploadInput.value = "";
        return;
      }

      // Show loading state
      imagePreview.src = "";
      imagePreviewContainer.style.display = "block";
      imagePreview.style.opacity = "0.5";

      // Add a loading indicator
      const loadingIndicator = document.createElement("div");
      loadingIndicator.id = "image-loading";
      loadingIndicator.innerHTML = `
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i>
              </div>
            `;
      imagePreviewContainer.appendChild(loadingIndicator);

      try {
        // Read file
        const imageDataUrl = await readFileAsDataURL(file);

        // Compress image
        postImageData = await compressImage(imageDataUrl, 0.6);

        // Update preview
        imagePreview.src = postImageData;
        imagePreview.style.opacity = "1";

        // Remove loading indicator
        const loadingElem = document.getElementById("image-loading");
        if (loadingElem) loadingElem.remove();
      } catch (error) {
        console.error("Error processing image:", error);
        alert("Error processing image. Please try again.");
        imagePreviewContainer.style.display = "none";
        imageUploadInput.value = "";
      }
    }
  });

  removeImageBtn.addEventListener("click", function () {
    postImageData = null;
    imagePreview.src = "";
    imagePreviewContainer.style.display = "none";
    imageUploadInput.value = "";
  });

  // Update createPost function to include image
  document.getElementById("postButton").addEventListener("click", createPost);
});

// Helper function to read file as data URL
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Updated createPost function
async function createPost() {
  const postText = document.getElementById("postInput").value.trim();

  if (!postText && !postImageData) {
    alert("Please enter some text or add an image for your post");
    return;
  }

  // Check if user is logged in
  const userData = localStorage.getItem("user");
  if (!userData) {
    alert("Please log in to create a post");
    return;
  }

  const user = JSON.parse(userData);

  // Show loading state
  const postButton = document.getElementById("postButton");
  const originalButtonText = postButton.innerHTML;
  postButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
  postButton.disabled = true;

  try {
    // If image is too large, compress it further
    let finalImageData = postImageData;
    if (postImageData && postImageData.length > 1000000) {
      // If > 1MB
      finalImageData = await compressImage(postImageData, 0.4); // Higher compression
    }

    const response = await fetch("http://localhost:3000/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        text: postText,
        image: finalImageData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create post");
    }

    // Clear input and image
    document.getElementById("postInput").value = "";
    postImageData = null;
    document.getElementById("image-preview").src = "";
    document.getElementById("image-preview-container").style.display = "none";
    document.getElementById("post-image-upload").value = "";

    // Add new post to top of feed
    const feedContainer = document.getElementById("feed");
    const postElement = createPostElement(data);

    if (feedContainer.firstChild) {
      feedContainer.insertBefore(postElement, feedContainer.firstChild);
    } else {
      feedContainer.appendChild(postElement);
    }

    // Show success message
    if (window.showToast) {
      showToast("Post created successfully!", "success");
    } else {
      console.log("Post created successfully!");
    }
  } catch (error) {
    console.error("Error creating post:", error);
    if (window.showToast) {
      showToast(
        error.message || "Error creating post. Please try again.",
        "error"
      );
    } else {
      alert(error.message || "Error creating post. Please try again.");
    }
  } finally {
    // Reset button state
    postButton.innerHTML = originalButtonText;
    postButton.disabled = false;
  }
}

// Function to like/unlike a post
async function likePost(button, postId) {
  // Check if user is logged in
  const userData = localStorage.getItem("user");
  if (!userData) {
    alert("Please log in to like posts");
    return;
  }

  const user = JSON.parse(userData);
  const isLiked = button.classList.contains("liked");
  const action = isLiked ? "unlike" : "like";

  try {
    const response = await fetch(
      `http://localhost:3000/api/posts/${postId}/like`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          action: action,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update like status");
    }

    const data = await response.json();

    // Update button UI
    button.classList.toggle("liked");

    if (button.classList.contains("liked")) {
      button.innerHTML = '<i class="fas fa-heart"></i> Liked';
    } else {
      button.innerHTML = '<i class="far fa-heart"></i> Like';
    }
  } catch (error) {
    console.error("Error liking post:", error);
    alert("Error updating like status. Please try again.");
  }
}

// Function to toggle comments visibility
function toggleComments(postId) {
  const commentsSection = document.getElementById(`comments-${postId}`);
  if (commentsSection.style.display === "none") {
    commentsSection.style.display = "block";
  } else {
    commentsSection.style.display = "none";
  }
}

// Function to add a comment
async function addComment(postId) {
  // Check if user is logged in
  const userData = localStorage.getItem("user");
  if (!userData) {
    alert("Please log in to comment");
    return;
  }

  const user = JSON.parse(userData);
  const commentText = document
    .getElementById(`comment-text-${postId}`)
    .value.trim();

  if (!commentText) {
    alert("Please enter a comment");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/api/posts/${postId}/comment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          text: commentText,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to add comment");
    }

    const comments = await response.json();

    // Clear input
    document.getElementById(`comment-text-${postId}`).value = "";

    // Update comments count
    const commentButton = document.querySelector(
      `div[data-post-id="${postId}"] .post-actions button:nth-child(2)`
    );
    commentButton.innerHTML = `<i class="far fa-comment"></i> Comments (${comments.length})`;

    // Update comments list
    const commentsList = document.querySelector(
      `#comments-${postId} .comments-list`
    );
    commentsList.innerHTML = comments
      .map((comment) => {
        const commentDate = new Date(comment.date);
        const formattedCommentDate = commentDate.toLocaleDateString();
        return `
              <div class="comment" style="margin-bottom: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                <strong>${
                  comment.user.name || user.name
                }</strong> <span style="color: #888; font-size: 12px;">${formattedCommentDate}</span>
                <p style="margin-top: 5px;">${comment.text}</p>
              </div>
            `;
      })
      .join("");
  } catch (error) {
    console.error("Error adding comment:", error);
    alert("Error adding comment. Please try again.");
  }
}

// Function to share post (simplified version)
function sharePost(postId) {
  alert(
    "Share functionality would open a dialog to share this post on other platforms or copy a link."
  );
  // In a real app, this would open a share dialog or copy a link to the post
}

// Setup notifications
document.addEventListener("DOMContentLoaded", function () {
  // Check if user is logged in
  const userData = localStorage.getItem("user");

  if (userData) {
    // Setup notification system
    setupNotifications();
  }
});

function setupNotifications() {
  const notificationsIcon = document.getElementById("notifications-icon");
  const notificationsDropdown = document.getElementById(
    "notifications-dropdown"
  );
  const notificationBadge = document.getElementById("notification-badge");
  const notificationsList = document.getElementById("notifications-list");
  const markAllReadBtn = document.getElementById("mark-all-read");

  // Toggle notifications dropdown
  notificationsIcon.addEventListener("click", function () {
    notificationsDropdown.classList.toggle("active");

    // If opening, fetch new notifications
    if (notificationsDropdown.classList.contains("active")) {
      fetchNotifications();
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (event) {
    if (
      !notificationsIcon.contains(event.target) &&
      !notificationsDropdown.contains(event.target)
    ) {
      notificationsDropdown.classList.remove("active");
    }
  });

  // Mark all as read
  markAllReadBtn.addEventListener("click", function () {
    markNotificationsAsRead();
  });

  // Initial fetch of notifications
  fetchNotifications();

  // Fetch notifications every 30 seconds
  setInterval(fetchNotifications, 30000);

  // Function to fetch notifications
  async function fetchNotifications() {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user) return;

      const response = await fetch(
        `http://localhost:3000/api/users/${user.id}/notifications`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const notifications = await response.json();

      // Update UI
      updateNotificationsUI(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      notificationsList.innerHTML = `
              <div class="notification-empty">Failed to load notifications</div>
            `;
    }
  }

  // Function to update notifications UI
  function updateNotificationsUI(notifications) {
    if (!notifications || notifications.length === 0) {
      notificationsList.innerHTML = `
              <div class="notification-empty">No notifications yet</div>
            `;
      notificationBadge.textContent = "0";
      notificationBadge.style.display = "none";
      return;
    }

    // Count unread notifications
    const unreadCount = notifications.filter((notif) => !notif.read).length;
    notificationBadge.textContent = unreadCount;
    notificationBadge.style.display = unreadCount > 0 ? "flex" : "none";

    // Render notifications
    notificationsList.innerHTML = notifications
      .map((notification) => {
        // Format time
        const date = new Date(notification.date);
        const timeAgo = getTimeAgo(date);

        // Get notification details
        const { type, from, text, read } = notification;
        const fromName = from?.name || "A user";
        const profilePic =
          from?.profilePicture || "https://via.placeholder.com/40";

        return `
              <div class="notification-item ${!read ? "unread" : ""}">
                <img src="${profilePic}" alt="${fromName}" class="notification-avatar">
                <div class="notification-content">
                  <p class="notification-text">${text}</p>
                  <p class="notification-time">${timeAgo}</p>
                </div>
              </div>
            `;
      })
      .join("");
  }

  // Function to mark all notifications as read
  async function markNotificationsAsRead() {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user) return;

      const response = await fetch(
        `http://localhost:3000/api/users/${user.id}/notifications/read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }

      // Update UI
      notificationBadge.textContent = "0";
      notificationBadge.style.display = "none";

      // Update the notification items
      const notificationItems = document.querySelectorAll(
        ".notification-item.unread"
      );
      notificationItems.forEach((item) => {
        item.classList.remove("unread");
      });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  }

  // Helper function to format time ago
  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + " years ago";
    if (interval === 1) return "1 year ago";

    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + " months ago";
    if (interval === 1) return "1 month ago";

    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + " days ago";
    if (interval === 1) return "1 day ago";

    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + " hours ago";
    if (interval === 1) return "1 hour ago";

    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + " minutes ago";
    if (interval === 1) return "1 minute ago";

    return "Just now";
  }
}

// Handle search form submission
function handleSearch(event) {
  event.preventDefault();
  const searchTerm = document.getElementById("search-input").value.trim();

  if (searchTerm) {
    searchUsers(searchTerm);
  }
}

// Function to search for users
async function searchUsers(searchTerm) {
  try {
    // Show loading state
    const searchResults = document.getElementById("search-results");
    searchResults.innerHTML = `
            <div class="search-empty">
              <i class="fas fa-spinner fa-spin"></i> Searching...
            </div>
          `;

    // Show search results container
    document.getElementById("search-results-container").classList.add("active");

    // Fetch users from API
    const response = await fetch(
      `http://localhost:3000/api/users/search?term=${searchTerm}`
    );

    if (!response.ok) {
      throw new Error("Failed to search users");
    }

    const users = await response.json();

    // Display search results
    displaySearchResults(users);
  } catch (error) {
    console.error("Error searching users:", error);
    document.getElementById("search-results").innerHTML = `
            <div class="search-empty">
              <p>Error searching users. Please try again.</p>
            </div>
          `;
  }
}

// Function to display search results
function displaySearchResults(users) {
  const searchResults = document.getElementById("search-results");
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  if (!users || users.length === 0) {
    searchResults.innerHTML = `
            <div class="search-empty">
              <p>No users found. Try a different search term.</p>
            </div>
          `;
    return;
  }

  // Clear previous results
  searchResults.innerHTML = "";

  // Add each user to results
  users.forEach((user) => {
    // Skip current user
    if (currentUser.id === user._id) return;

    // Check if current user is following this user
    const isFollowing =
      currentUser.following &&
      currentUser.following.some((follow) => follow.user === user._id);

    const userElement = document.createElement("div");
    userElement.className = "search-result-item";
    userElement.innerHTML = `
            <div class="search-result-item">
              <img src="${user.profilePicture}" alt="${user.name}" class="search-result-avatar">
              <div class="search-result-info">
                <h3>${user.name}</h3>
                <p>${user.bio}</p>
              </div>
            </div>
          `;

    searchResults.appendChild(userElement);
  });
}

// Add function to view full-size images
function viewFullImage(imageSrc) {
  const overlay = document.createElement("div");
  overlay.className = "image-overlay";
  overlay.innerHTML = `
          <div class="full-image-container">
            <img src="${imageSrc}" alt="Full-size image" class="full-image">
            <button class="close-overlay">×</button>
          </div>
        `;

  document.body.appendChild(overlay);

  // Prevent scrolling when overlay is open
  document.body.style.overflow = "hidden";

  // Add close functionality
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay || e.target.className === "close-overlay") {
      document.body.removeChild(overlay);
      document.body.style.overflow = "";
    }
  });

  // Also close on Escape key
  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") {
      document.body.removeChild(overlay);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", escHandler);
    }
  });
}