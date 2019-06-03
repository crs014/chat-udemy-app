const socket = io();
const $messageForm = document.getElementById('msg-form');
const $messageFormInput = $messageForm.querySelector('input'); 
const $messageFormButton = $messageForm.querySelector('button'); 
const $sendLocationButton = document.getElementById('send-location');
const $message = document.getElementById('messages');

const messageTemplate = document.getElementById('message-template').innerHTML;
const locationMessageTemplate = document.getElementById('location-message-template').innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;


const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix : true });
const autoscroll = () => {
    //new message element
    const $newMessage = $message.lastElementChild;

    //height of the new message
    const newMessageStyle = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyle.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //visible height 
    const visibleHeight = $message.offsetHeight;

    //height of messages container
    const containerHeight = $message.scrollHeight;

    //how fa have i scrolled
    const scrollOffset = $message.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $message.scrollTop = $message.scrollHeight;
    }
};


socket.on('message', (message) => {
    //console.log(message);
    const html = Mustache.render(messageTemplate, { 
        message : message.text,
        username : message.username,
        createdAt : moment(message.createdAt).format('h:mm a') 
    });
    $message.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (data) => {
    const html = Mustache.render(locationMessageTemplate,{ 
        url : data.url, 
        username : data.username, 
        createdAt : moment(data.createdAt).format('h:mm a')
    });
    $message.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.getElementById('sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    $messageFormButton.setAttribute('disabled', 'disabled');

    //const text = document.getElementById("text").value;
    const text = e.target.elements.msg.value;
    socket.emit('sendMessage',text, (msg) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = "";
        $messageFormInput.focus();
        console.log(msg);
    });
});

$sendLocationButton.addEventListener('click', (e) => {
    if(!navigator.geolocation){
        return alert('geolocation is not support your browser');
    }
    $sendLocationButton.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            lat : position.coords.latitude,
            long : position.coords.longitude
        },() => {
            $sendLocationButton.removeAttribute('disabled');
            console.log("location shared")
        });
    });
});


socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error);
        location.href = '/'
    }
});