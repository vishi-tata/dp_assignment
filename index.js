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
  let clonedComments = JSON.parse(JSON.stringify(comments));
  let beforeSorted = clonedComments.map((item) => item.score);
  clonedComments = clonedComments.sort((a, b) => b.score - a.score);
  let afterSorted = clonedComments.map((item) => item.score);
  if (JSON.stringify(beforeSorted) !== JSON.stringify(afterSorted)) {
    comments = comments.sort((a, b) => b.score - a.score);
    renderComments();
    updateLocalStorage();
  }
  console.log('beforeSorted', beforeSorted)
  console.log('afterSorted', afterSorted)
}

function sendComment(event, type) {
  event.preventDefault();
  let textArea = document.getElementById(`${type}_area`);
  let message = textArea.value;
  textArea.value = "";
  if (currentComment) {
    if (currentComment.action === 'isEditing') {
      for (let item of comments) {
        if (!currentComment.isReply) {
          if (item.id === currentComment.commentId) {
            item.content = message;
            let p = `<p class="comment-item-content" id="message_${currentComment.commentId}">${item.content}</p>`
            document.getElementById("edit_comment_form").remove();
            document.getElementById(`comment_${currentComment.commentId}`).appendChild(stringToNode(p));
            document.querySelectorAll(`#comment_${currentComment.commentId} .comment-item-actions a`).forEach((node) => {
              node.classList.remove('disableClick');
            });
            updateLocalStorage();
            currentComment = null;
            break;
          }
        } else {
          for (let subItem of item.replies) {
            if (subItem.id === currentComment.commentId) {
              subItem.content = message;
              let p = `<p class="comment-item-content" id="message_${currentComment.commentId}"><span class="replyingTo">@${currentComment.replyingTo}</span> ${subItem.content}</p>`
              document.getElementById("edit_comment_form").remove();
              document.getElementById(`comment_${currentComment.commentId}`).appendChild(stringToNode(p));
              document.querySelectorAll(`#comment_${currentComment.commentId} .comment-item-actions a`).forEach((node) => {
                node.classList.remove('disableClick');
              });
              updateLocalStorage();
              currentComment = null;
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
        "createdAt": new Date().toLocaleString(),
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
            currentComment = null;
            if (type === 'reply') {
              document.getElementById('reply-input-area').remove();
            }
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
              currentComment = null;
              if (type === 'reply') {
                document.getElementById('reply-input-area').remove();
              }
              return;
            }
          }
        }
      }
    }
  } else {
    let newComment = {
      "id": new Date().getTime(),
      "content": message,
      "createdAt": new Date().toLocaleString(),
      "score": 0,
      "user": JSON.parse(JSON.stringify(currentUser)),
      "replies": []
    }
    let commentStr = createComment(newComment, false);
    let commentsContainer = document.querySelector(".comments");
    let commentNodes = stringToNode(commentStr)
    commentsContainer.appendChild(commentNodes);
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
      <a onclick="onClickVote(${comment.id}, ${isReply}, 'add')" ><img src="images/icon-plus.svg" alt="plus"></a>
        <p id="score_${comment.id}">${comment.score}</p><a onclick="onClickVote(${comment.id}, ${isReply}, 'minus')"><img src="images/icon-minus.svg" alt="minus"></a>
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
  if (currentComment) {
    if (currentComment.action === 'isEditing') {
      for (let item of comments) {
        if (!currentComment.isReply) {
          if (item.id === currentComment.commentId) {
            let p = `<p class="comment-item-content" id="message_${currentComment.commentId}">${item.content}</p>`
            document.getElementById("edit_comment_form").remove();
            document.getElementById(`comment_${currentComment.commentId}`).appendChild(stringToNode(p));
            document.querySelectorAll(`#comment_${currentComment.commentId} .comment-item-actions a`).forEach((node) => {
              node.classList.remove('disableClick');
            });
            break;
          }
        } else {
          for (let subItem of item.replies) {
            if (subItem.id === currentComment.commentId) {
              let p = `<p class="comment-item-content" id="message_${currentComment.commentId}"><span class="replyingTo">@${currentComment.replyingTo}</span> ${subItem.content}</p>`
              document.getElementById("edit_comment_form").remove();
              document.getElementById(`comment_${currentComment.commentId}`).appendChild(stringToNode(p));
              document.querySelectorAll(`#comment_${currentComment.commentId} .comment-item-actions a`).forEach((node) => {
                node.classList.remove('disableClick');
              });
              break;
            }
          }
        }
      }
    } else {
      document.getElementById('reply-input-area').remove();
    }
  }
  let message = document.getElementById(`message_${commentId}`).innerText;
  message = message.replace(`@${replyingTo} `, '');
  let textarea = `<div id="edit_comment_form"><form><textarea value="${message}" id="edit_area" rows="4"></textarea>
  </form><button type="button" onclick="sendComment(event,'edit')">UPDATE</button></div>
  `;
  document.getElementById(`message_${commentId}`).remove();
  document.getElementById(`comment_${commentId}`).appendChild(stringToNode(textarea));
  let textArea = document.getElementById('edit_area');
  textArea.value = message;
  textArea.setSelectionRange(message.length, message.length);
  textArea.focus();
  document.querySelectorAll(`#comment_${commentId} .comment-item-actions a`).forEach((node) => {
    node.classList.add('disableClick');
  });
  currentComment = { commentId, isReply, replyingTo, action: 'isEditing' };
}

function replyComment(commentId, isReply, replyingTo) {
  if (currentComment) {
    if (currentComment.commentId === commentId) {
      return;
    } else if (currentComment.action === 'isReplying') {
      // prompt('Do you want discard changes?');//todo
      document.getElementById('reply-input-area').remove();
    } else if (currentComment.action === 'isEditing') {
      for (let item of comments) {
        if (!currentComment.isReply) {
          if (item.id === currentComment.commentId) {
            let p = `<p class="comment-item-content" id="message_${currentComment.commentId}">${item.content}</p>`
            document.getElementById("edit_comment_form").remove();
            document.getElementById(`comment_${currentComment.commentId}`).appendChild(stringToNode(p));
            document.querySelectorAll(`#comment_${currentComment.commentId} .comment-item-actions a`).forEach((node) => {
              node.classList.remove('disableClick');
            });
            break;
          }
        } else {
          for (let subItem of item.replies) {
            if (subItem.id === currentComment.commentId) {
              let p = `<p class="comment-item-content" id="message_${currentComment.commentId}"><span class="replyingTo">@${currentComment.replyingTo}</span> ${subItem.content}</p>`
              document.getElementById("edit_comment_form").remove();
              document.getElementById(`comment_${currentComment.commentId}`).appendChild(stringToNode(p));
              document.querySelectorAll(`#comment_${currentComment.commentId} .comment-item-actions a`).forEach((node) => {
                node.classList.remove('disableClick');
              });
              break;
            }
          }
        }
      }
    }
  }
  currentComment = { commentId, isReply, replyingTo, action: 'isReplying' };
  let replyingToMessage = `@${replyingTo} `;
  renderInputArea(replyingToMessage);
  let textArea = document.getElementById('reply_area');
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
        onCancel();
        break;
      }
    } else {
      for (let j = 0; j < item.replies.length; j++) {
        let subItem = item.replies[j];
        if (subItem.id === commentId) {
          document.getElementById(`comment_${commentId}`).remove();
          item.replies.splice(j, 1);
          updateLocalStorage();
          onCancel();
          return;
        }
      }
    }
  }
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

function renderInputArea(replyingToMessage) {
  let inputArea = `<div id="reply-input-area" class="${currentComment.isReply ? 'reply' : ''}">
  <img class="comment-item-image" src="./images/avatars/image-juliusomo.png" alt="juliusomo">
  <form>
    <textarea rows="4" placeholder="Add a comment..." id="reply_area" value="${replyingToMessage}"></textarea>
    </form>
    <button onclick="sendComment(event,'reply')" type="button">REPLY</button>
</div>`;
  document.getElementById(`comment_${currentComment.commentId}`).insertAdjacentHTML('afterend', inputArea);
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
  comments = data.comments.sort((a, b) => b.score - a.score);
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

function stringToNode(str) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(str, "text/html");
  return doc.body.firstChild;
}

init();