// // Toggle mobile menu
// document.getElementById("menuToggle").addEventListener("click", function () {
//   document.getElementById("navMenu").classList.toggle("active");
// }); 

// Like post functionality
function likePost(button) {
  button.classList.toggle("liked");

  if (button.classList.contains("liked")) {
    button.innerHTML = '<i class="fas fa-heart"></i> Liked';
  } else {
    button.innerHTML = '<i class="far fa-heart"></i> Like';
  }
}

// Post status functionality
function postStatus() {
  const postInput = document.getElementById("postInput");
  const content = postInput.value.trim();

  if (content !== "") {
    const feed = document.getElementById("feed");
    const newPost = document.createElement("div");
    newPost.className = "post";

    newPost.innerHTML = `
          <h3>Your Name</h3>
          <p>${content}</p>
          <div class="post-actions">
            <button onclick="likePost(this)">
              <i class="far fa-heart"></i> Like
            </button>
            <button>
              <i class="far fa-comment"></i> Comment
            </button>
            <button>
              <i class="fas fa-share"></i> Share
            </button>
          </div>
        `;

    feed.insertBefore(newPost, feed.firstChild);
    postInput.value = "";
  }
}
