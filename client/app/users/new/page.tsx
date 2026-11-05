'use client'
import React from 'react'
import { useUser } from '@auth0/nextjs-auth0/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { apiUrl } from '@/lib/api';

const brandNavy = '#284472';
const brandLightPink = "#fdf5f3";
const brandPink = "#FDEEEA";
const brandLightBrown = "#efe4e1";
const brandBrown = "#675a5e";

// This page is for new users to complete account creation
// Saves new users to database
function NewUsersPage() {
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const router = useRouter(); // for page redirect
  const {user, error, isLoading} = useUser(); // get this user

  if (!user) {
    return; // ensure user is logged in
  }

  // Submitting the form saves the information to the database through POST
  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    let valid = true;
    if (!first_name.trim()) {
      setFirstNameError('First name is required');
      valid = false;
    }
    if (!last_name.trim()) {
      setLastNameError('Last name is required');
      valid = false;
    }
    if (!valid) return;

    // get data from this logged in user
    const newUserData = {email: user.email, first_name, last_name, bio};

    // send data through POST
    const response = await fetch(apiUrl('/api/users/new'), {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(newUserData),
    });

    const result = await response.json();

    // redirect to profile page when user submits form
    if (response.ok) {
      console.log('User saved:', result);
      sessionStorage.setItem('newuser_complete', 'true'); // prevent redirect back to here after completion
      router.push("/profile");
    } else {
      console.log('Error:', result);
    }
  };

  return (
      <div
          className="min-h-screen flex items-center justify-center"
          style={{backgroundColor: brandPink}}
      >
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-10 mx-4">
          {/* Logo inside the white box */}
          <div className="flex justify-center mb-8">
            <Image
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/cbcbc59fadb92cbfa94f7a46414d883263e97dc4"
                alt="Closet Circle"
                className="w-[200px] h-auto"
                height={80}
                priority
                unoptimized
                width={200}
            />
          </div>

          <h1
              className="text-center text-2xl font-semibold mb-8"
              style={{color: brandBrown}}
          >
            Continue Account Creation
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                  htmlFor="first_name"
                  className="block mb-2 font-medium"
                  style={{color: brandBrown}}
              >
                First name
              </label>
              <input
                  id="first_name"
                  type="text"
                  value={first_name}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (firstNameError) setFirstNameError('');
                  }}
                  className="w-full border-2 rounded-lg px-4 py-2"
                  style={{borderColor: firstNameError ? 'red' : brandLightBrown, color: brandNavy}}
              />
              {firstNameError && <p className="text-red-500 text-sm mt-1">{firstNameError}</p>}
            </div>

            <div>
              <label
                  htmlFor="last_name"
                  className="block mb-2 font-medium"
                  style={{color: brandBrown}}
              >
                Last name
              </label>
              <input
                  id="last_name"
                  type="text"
                  value={last_name}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (lastNameError) setLastNameError('');
                  }}
                  className="w-full border-2 rounded-lg px-4 py-2"
                  style={{borderColor: lastNameError ? 'red' : brandLightBrown, color: brandNavy}}
              />
              {lastNameError && <p className="text-red-500 text-sm mt-1">{lastNameError}</p>}
            </div>

            <div>
              <label
                  htmlFor="bio"
                  className="block mb-2 font-medium"
                  style={{color: brandBrown}}
              >
                Bio
              </label>
              <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full border-2 rounded-lg px-4 py-2 h-32 resize-none"
                  style={{borderColor: brandLightBrown, color: brandNavy}}
              />
            </div>

            <button
                type="submit"
                className="w-full text-white rounded-2xl px-4 py-2 mt-4"
                style={{backgroundColor: brandNavy}}
            >
              Create Account
            </button>
          </form>
        </div>
      </div>
  )
}

export default NewUsersPage;
