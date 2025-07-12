import { useEffect, useState } from "react";


export default function Dashboard(){
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch('http://localhost:5000/api/hello')
            .then(res => res.json())
            .then(data => setData(data.message));

    }, [])

    return (
        <>
            <h1>This is the Dashboard!</h1>
            <p>{data || "Loading..."} </p>
        </>
    )
}