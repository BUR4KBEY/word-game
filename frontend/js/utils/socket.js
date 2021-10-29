const socket = io('http://localhost:3000', {
	auth: {
		token: localStorage.getItem('token')
	}
});

socket.on('swal-error', desc =>
	Swal.fire({
		icon: 'error',
		title: 'Oops...',
		text: desc
	})
);

export default socket;
