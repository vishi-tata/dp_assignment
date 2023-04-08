var currentUser = {};
var comments = [];
let currentComment;

function createCurrentUser() {
  let currentUserElement = document.querySelector("#comment-input-area .comment-item-image");
  currentUserElement.src = currentUser.image.png;
  currentUserElement.alt = currentUser.username;
}

function updateLocalStorage() {
  localStorage.setItem('data', JSON.stringify({ currentUser, comments }));
}

function onClickVote(commentId, isReply, type) {
  for (let item of comments) {
    if (!isReply) {
      if (item.id === commentId) {
        if (type === 'add') {
          item.score += 1;
        } else {
          item.score -= 1;
        }
        document.getElementById(`score_${commentId}`).innerText = item.score;
        updateLocalStorage();
        break;
      }
    } else {
      for (let subItem of item.replies) {
        if (subItem.id === commentId) {
          if (type === 'add') {
            subItem.score += 1;
          } else {
            subItem.score -= 1;
          }
          document.getElementById(`score_${commentId}`).innerText = subItem.score;
          updateLocalStorage();
          return;
        }
      }
    }
  }
}

function sendComment(event) {
  event.preventDefault();
  let textArea = document.getElementById('comment_area');
  let message = textArea.value;
  textArea.value = "";
  if (currentComment) {
    if (currentComment.action === 'isEditing') {
      for (let item of comments) {
        if (!currentComment.isReply) {
          if (item.id === currentComment.commentId) {
            item.content = message;
            document.getElementById(`message_${currentComment.commentId}`).innerText = item.content;
            updateLocalStorage();
            break;
          }
        } else {
          for (let subItem of item.replies) {
            if (subItem.id === currentComment.commentId) {
              subItem.content = message;
              document.getElementById(`message_${currentComment.commentId}`).innerHTML = `<span class="replyingTo">@${currentComment.replyingTo}</span> ` + subItem.content;
              updateLocalStorage();
              return;
            }
          }
        }
      }
    } else {
      message = message.replace(`@${currentComment.replyingTo} `, '');
      let newComment = {
        "id": new Date().getTime(),
        "content": message,
        "createdAt": new Date().toISOString(),
        "score": 0,
        "user": JSON.parse(JSON.stringify(currentUser)),
        "replyingTo": currentComment.replyingTo,
      }
      for (let item of comments) {
        let requiredId;
        if (!currentComment.isReply) {
          if (item.id === currentComment.commentId) {
            if (item.replies.length === 0) {
              requiredId = item.id;
            } else {
              requiredId = item.replies[item.replies.length - 1].id;
            }
            item.replies.push(newComment);
            let commentStr = createComment(newComment, true);
            document.getElementById(`comment_${requiredId}`).insertAdjacentHTML('afterend', commentStr);
            updateLocalStorage();
            break;
          }
        } else {
          for (let subItem of item.replies) {
            if (subItem.id === currentComment.commentId) {
              requiredId = item.replies[item.replies.length - 1].id;
              item.replies.push(newComment);
              let commentStr = createComment(newComment, true);
              document.getElementById(`comment_${requiredId}`).insertAdjacentHTML('afterend', commentStr);
              updateLocalStorage();
              return;
            }
          }
        }
      }
    }
    currentComment = null;
  } else {
    let newComment = {
      "id": new Date().getTime(),
      "content": message,
      "createdAt": new Date().toISOString(),
      "score": 0,
      "user": JSON.parse(JSON.stringify(currentUser)),
      "replies": []
    }
    let commentStr = createComment(newComment, false);
    let commentsContainer = document.querySelector(".comments");
    const parser = new DOMParser();
    const doc = parser.parseFromString(commentStr, "text/html");
    const nodes = doc.body.firstChild;
    commentsContainer.appendChild(nodes);
    comments.push(newComment);
    updateLocalStorage();
  }
}

function createComment(comment, isReply) {
  let isCurrentUser = comment.user.username === currentUser.username;
  return `
  <li class="comment ${isReply ? "reply" : ""}" id="comment_${comment.id}">
    <div class="comment-item-container">
      <div class="comment-item-vote">
        <a onclick="onClickVote(${comment.id}, ${isReply}, 'minus')"><img src="images/icon-minus.svg" alt="minus"></a>
        <p id="score_${comment.id}">${comment.score}</p>
        <a onclick="onClickVote(${comment.id}, ${isReply}, 'add')" ><img src="images/icon-plus.svg" alt="plus"></a>
      </div>
    </div>
    <div class="comment-item-details">
      <img class="comment-item-image" src="${comment.user.image.png}" alt="${comment.user.username}">
      <h2 class="comment-item-name">
      ${comment.user.username}
      </h2>
      <p class="badge ${isCurrentUser ? "" : "hidden"}">you</p>
      <p class="comment-item-time">
      ${comment.createdAt}
      </p>
    </div>
    <div class="comment-item-actions">
      ${isCurrentUser ? `<a onclick="displayDeleteModal(${comment.id},${isReply})"><img src="images/icon-delete.svg" alt="delete"> Delete</a>
      <a onclick="editComment(${comment.id}, ${isReply},'${comment.replyingTo}')"><img src="images/icon-edit.svg" alt="edit"> Edit</a>` : `<a onclick="replyComment(${comment.id},${isReply},'${comment.user.username}')"><img src="images/icon-reply.svg" alt="reply"> Reply</a>`}
    </div>
    <p class="comment-item-content" id="message_${comment.id}">
    ${isReply ? `<span class="replyingTo">@${comment.replyingTo}</span>` : ""}
      ${comment.content}
    </p>
  </li>
  `
}

function editComment(commentId, isReply, replyingTo) {
  let message = document.getElementById(`message_${commentId}`).innerText;
  message = message.replace(`@${replyingTo} `, '');
  let textArea = document.getElementById('comment_area');
  textArea.value = message;
  textArea.setSelectionRange(message.length, message.length);
  textArea.focus();
  currentComment = { commentId, isReply, replyingTo, action: 'isEditing' };
}

function replyComment(commentId, isReply, replyingTo) {
  currentComment = { commentId, isReply, replyingTo, action: 'isReplying' };
  let textArea = document.getElementById('comment_area');
  let replyingToMessage = `@${replyingTo} `;
  textArea.value = replyingToMessage;
  textArea.setSelectionRange(replyingToMessage.length, replyingToMessage.length);
  textArea.focus();
}

function displayDeleteModal(commentId, isReply) {
  currentComment = { commentId, isReply };
  document.getElementById('backdrop').style.display = "block";
  document.querySelector('.modal').style.display = "block";
}

function onCancel() {
  currentComment = null;
  document.getElementById('backdrop').style.display = "none";
  document.querySelector('.modal').style.display = "none";
}

function deleteComment() {
  let { commentId, isReply } = currentComment;
  for (let i = 0; i < comments.length; i++) {
    let item = comments[i];
    if (!isReply) {
      if (item.id === commentId) {
        document.getElementById(`comment_${commentId}`).remove();
        item.replies.forEach((subItem) => {
          document.getElementById(`comment_${subItem.id}`).remove();
        });
        comments.splice(i, 1);
        updateLocalStorage();
        break;
      }
    } else {
      for (let j = 0; j < item.replies.length; j++) {
        let subItem = item.replies[j];
        if (subItem.id === commentId) {
          document.getElementById(`comment_${commentId}`).remove();
          item.replies.splice(j, 1);
          updateLocalStorage();
          return;
        }
      }
    }
  }
  onCancel();
}

function renderComments() {
  let commentsContainer = document.querySelector(".comments");
  let commentsElement = []
  comments.forEach(item => {
    commentsElement.push(createComment(item, false));
    item.replies.forEach(subItem => {
      commentsElement.push(createComment(subItem, true));
    });
  });
  commentsContainer.innerHTML = commentsElement.join("");
}

function renderInputArea(type) {
  let inputArea = `<div id="comment-input-area">
  <img class="comment-item-image" src="./images/avatars/image-juliusomo.png" alt="juliusomo">
  <form onsubmit="sendComment(event)">
    <textarea rows="4" placeholder="Add a comment..." id="comment_area"></textarea>
    <button>${type}</button>
  </form>
</div>`
  for (let item of comments) {
    let requiredId;
    if (!currentComment.isReply) {
      if (item.id === currentComment.commentId) {
        if (item.replies.length === 0) {
          requiredId = item.id;
        } else {
          requiredId = item.replies[item.replies.length - 1].id;
        }
        item.replies.push(newComment);
        let commentStr = createComment(newComment, true);
        document.getElementById(`comment_${requiredId}`).insertAdjacentHTML('afterend', commentStr);
        updateLocalStorage();
        break;
      }
    } else {
      for (let subItem of item.replies) {
        if (subItem.id === currentComment.commentId) {
          requiredId = item.replies[item.replies.length - 1].id;
          item.replies.push(newComment);
          let commentStr = createComment(newComment, true);
          document.getElementById(`comment_${requiredId}`).insertAdjacentHTML('afterend', commentStr);
          updateLocalStorage();
          return;
        }
      }
    }
  }
}

async function loadData() {
  try {
    let response = await fetch('data.json');
    let data = await response.json();
    setData(data);
  } catch (error) {
    console.log('not able to load the data :>> ', error);
  }
}

function setData(data) {
  currentUser = data.currentUser;
  comments = data.comments;
  updateLocalStorage();
  renderComments();
  createCurrentUser();
}

async function init() {
  // if the data is not available in localStorage then make an api.
  if (!localStorage.getItem('data')) {
    await loadData();
  } else {
    try {
      // pick the data from localstorage.
      let data = JSON.parse(localStorage.getItem('data'));
      setData(data);
    } catch (error) {
      await loadData();
    }
  }
}

init();