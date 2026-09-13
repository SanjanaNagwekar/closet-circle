'use client'
import React from 'react'
import { useUser } from '@auth0/nextjs-auth0/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';


// Checkbox component for form
const Checkbox = ({ isChecked, label, checkHandler, index }: { isChecked: any, label: String, checkHandler: any, index: any }) => {
    return (
        <div>
            <input
                type="checkbox"
                id={`checkbox=${index}`}
                value={isChecked}
                onChange={checkHandler}
            />
            <label htmlFor={`checkbox=${index}`}>{label}</label>
        </div>
    );
};


// Item categories
const item_categories = [
    { label: "Women's", checked: false, db_val: 6 },
    { label: "Men's", checked: false, db_val: 7 },
    { label: "Shirts", checked: false, db_val: 1 },
    { label: "Pants", checked: false, db_val: 4 },
    { label: "Dresses", checked: false, db_val: 5 },
    { label: "Shoes", checked: false, db_val: 2 },
    { label: "Jackets", checked: false, db_val: 3 },
    { label: "Winter", checked: false, db_val: 10 },
    { label: "Fall", checked: false, db_val: 9 },
    { label: "Spring", checked: false, db_val: 11 },
    { label: "Summer", checked: false, db_val: 8 },
];


// Item conditions
const new_condition = {
    field: "new",
    desc: "New - Never worn",
}
const used_excellent = {
    field: "excellent",
    desc: "Used - Excellent",
}
const used_good = {
    field: "good",
    desc: "Used - Good",
}
const used_fair = {
    field: "worn",
    desc: "Used - Fair",
}


// This page is for user input for creating a post for a clothing item
// Saves post information to database
function UploadPost() {
    const [closet_id] = useState('');
    const [title, setTitle] = useState('');
    const [item_picture, setPicturePath] = useState('');
    const [description, setDescription] = useState('');
    const [date_posted] = useState(getFormattedDate());
    const [item_condition, setCondition] = useState('');
    const [categoriesBox, setCategoryCheckbox] = useState(item_categories);


    const router = useRouter();
    const { user } = useUser();


    if (!user) {
        return null;
    }


    function getFormattedDate() {
        const date = new Date();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const yr = date.getFullYear();
        return `${yr}-${month}-${day}`;
    }


    const onHandleChangeCheckbox = (index: any) => {
        setCategoryCheckbox(
            categoriesBox.map((cat, currentIx) => {
                return currentIx === index
                    ? { ...cat, checked: !cat.checked }
                    : cat;
            }));
    };


    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();

        const postInfo = {
            closet_id: 0,
            owner_id: user.email,
            title,
            likes: 0,
            item_picture,
            description,
            date_posted,
            item_condition,
            categoriesBox
        };

        const response = await fetch('http://localhost:8800/api/profile/upload-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postInfo),
        });

        const result = await response.json();

        if (response.ok) {
            console.log('Post saved:', result);
            router.push("/profile");
        } else {
            console.log('Error:', result);
        }
    };

    return (
        <main>
            <h1>Post an Item</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <br />

                <input
                    type="text"
                    placeholder="Link to item picture"
                    value={item_picture}
                    onChange={(e) => setPicturePath(e.target.value)}
                />

                <img src={item_picture !== '' ? item_picture : undefined} alt={title ? `${title} preview` : 'Item preview'} />

                <br />

                <input
                    type="text"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <br />

                <select id="conditionDropdown" value={item_condition} onChange={(e) => setCondition(e.target.value)}>
                    <option value="">Select Item Condition</option>
                    <option value={new_condition.field}>{new_condition.desc}</option>
                    <option value={used_excellent.field}>{used_excellent.desc}</option>
                    <option value={used_good.field}>{used_good.desc}</option>
                    <option value={used_fair.field}>{used_fair.desc}</option>
                </select>

                <br />

                <div>
                    <p>Select Item Categories:</p>
                    {categoriesBox.map((cat, index) => (
                        <Checkbox
                            key={cat.label}
                            isChecked={cat.checked}
                            label={cat.label}
                            checkHandler={() => onHandleChangeCheckbox(index)}
                            index={index}
                        />
                    ))}
                </div>

                <br />

                <button type="submit">Upload Item</button>
            </form>
        </main>
    );
}


export default UploadPost;
