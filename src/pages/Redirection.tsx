import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Redirection: React.FC = () => {
    const code = window.location.search;
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!localStorage.getItem('userId')) {
                    const response = await axios.get(`${process.env.REACT_APP_URL}/oauth${code}`);
                    localStorage.setItem('userId', response.data.user.id);
                    console.log('User ID:', localStorage.getItem('userId'));
                }
                navigate('/main');
            } catch (error) {
                console.error('Error during fetching data', error);
            }
        };

        fetchData();
    }, [code, navigate]);

    return <div>로그인 중입니다.</div>;
};

export default Redirection;
