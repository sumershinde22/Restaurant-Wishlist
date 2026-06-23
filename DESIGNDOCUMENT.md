# Project 2 Design Document

## Project 2 Name

Restaurant Wishlist

## Team Members

- @Sumer Shinde
- @Catherine Han

## Description

Restaurant Wishlist is a full-stack web app that lets food enthusiasts save, organize, and share restaurants they want to visit. Users create a personal profile, add restaurants to their wishlist with notes and tags, and browse public wishlists from other users. The app serves as a lightweight social discovery tool. It is half a personal tracker and half a community recommendation engine.

## User Personas

### Foodie

A person who enjoys visiting various restaurants and wants to keep a personal record of places they plan to try.

### Explorer

A person who is new to an area or looking for inspiration, and wants to discover restaurants by browsing what other users have saved and reviewed.

## User Stories

### US-01: Profile & Wishlist Management (CRUD)

As a foodie, I want to create a user profile and manage my restaurant wishlist (adding, editing, and removing entries) so that I always have an up-to-date record of places I want to try. Each restaurant entry stores a name, cuisine type, location, personal notes, and a visited flag.

### US-02: Mark as Visited

As a foodie, I want to mark a saved restaurant as visited and optionally add a short review, so that I can distinguish between places I've been and places still on my list. My wishlist displays visited and unvisited entries separately.

### US-03: Browse Other Users' Wishlists

As an explorer, I want to browse other users' public wishlists by username, so that I can discover new restaurants through people whose taste I trust. I can view their full list along with their notes and reviews.

### US-04: Save from Another User's List

As an explorer, I want to copy a restaurant from someone else's wishlist directly into my own, so that I can quickly act on a recommendation without re-entering all the details manually.

The three MongoDB collections are Users (storing user info), Restaurants (storing restaurant info), and Wishlists (storing wishlist entries including references to a User and a Restaurant). Each user story touches these collections independently. US-01 handles full CRUD across all three, US-02 is a targeted update on a single Wishlists document, US-03 is read-only queries across all collections, and US-04 is a new insert into Wishlists without modifying the source document.

## Design Mockups

### Login View (Page)

[TOPNAV]  
[TEXT: APP TITLE]  
[FORM: LOGIN/CREATE ACCOUNT]

### My Wishlist View (Page)

[TOPNAV][BUTTON: SIGN OUT]  
[FORM: ADD/EDIT]  
[LIST: MY WISHLIST ENTRIES]  
[LIST: OTHER USERS WISHLISTS]

### Other Users Wishlist View (Modal)

[LIST: OTHER USER'S WISHLIST ENTRIES]

## Tech Stack

- Frontend: Vanilla JavaScript, HTML, CSS
- Backend: Node.js + Express
- Database: MongoDB
- Data Requests: Fetch API

## Work Distribution

### @Sumer Shinde

US-01 and US-02 (single-user experience: profile management, wishlist CRUD, and marking restaurants as visited)

### @Catherine Han

US-03 and US-04 (multi-user experience: browsing other users' wishlists and saving restaurants from them)
