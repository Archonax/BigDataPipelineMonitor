import axios from 'axios';

const Calls = axios.create({
    baseURL: 'http://localhost:8000', // Adresa našeho běžícího backendu
});

export default Calls;