const socket = io();
// const { EmojiButton } = require ('@joeattardi/emoji-button');
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options

const { username, room, password } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const emojify = (message) => {
  message = message.replaceAll(":)", "😊");
  message = message.replaceAll(":(", "😔");
  message = message.replaceAll(":|", "😑");
  message = message.replaceAll(":smirk:", "😏");
  message = message.replaceAll("<3", "❤️");

  return message;
};

const autoScroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

// const picker = new EmojiButton();
// const trigger = document.querySelector('.trigger');

// picker.on('emoji', selection => {
//   // `selection` object has an `emoji` property
//   // containing the selected emoji
// });

// trigger.addEventListener('click', () => picker.togglePicker(trigger));

socket.on("message", (message) => {
  console.log(message.text);
  if (message.text) {
    message.text = emojify(message.text);
  }
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text, //.toString().replace("hi", "bad"),
    createdAt: moment(message.createdAt).format("h:mm A"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", (message) => {
  console.log(message);
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm A"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.message.value;

  socket.emit("sendMessage", message, (error) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent");
  });
  $messageFormButton.removeAttribute("disabled");
  $messageFormInput.value = "";
  $messageFormInput.focus();
});

$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  $sendLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $sendLocationButton.removeAttribute("disabled");
        console.log("Location shared");
      }
    );
  });
});

socket.emit("join", { username, room, password }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
  if (room === "Private") {
    if (password !== "amogus") {
      alert("Acsess Denied");
      location.href = "/";
    }
  }
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });

  document.querySelector("#sidebar").innerHTML = html;
});
