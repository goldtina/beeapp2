# Beereadyagency

You are an expert full-stack developer, product designer, and hackathon-winning software engineer.

I am participating in MLH Hack for Humanity and building a hospitality staffing platform called Bee Ready Agency.

Brand name: Bee Ready Agency

Tagline: "The Right Staff, Right When You Need Them."

Mission: Help hospitality businesses overcome unexpected staffing shortages while providing hospitality workers with flexible earning opportunities.

Product Overview

Build a beautiful, fully responsive web application that connects hospitality workers with pubs, restaurants, bars, cafés, and hotels needing short-notice staff.

Workers can indicate their availability and apply for shifts. Businesses can post urgent shifts, discover available workers, and confirm bookings.

The application should feel like a real, professional staffing agency rather than a generic job board.

Branding and Design

Use a modern, premium visual identity inspired by bees and hospitality.

Colour palette:

Honey yellow: #F4B400

Charcoal black: #171717

Cream white: #FFF9E9

Warm grey: #737373

Create a distinctive bee-inspired logo using an original SVG or CSS design.

Use subtle honeycomb patterns, rounded cards, elegant typography, polished hover effects, and smooth animations.

Avoid childish cartoon styling. The design should feel trustworthy, energetic, and professional.

Landing Page

Headline:
"Short Staffed? Bee Ready."

Subheading:
"Connecting hospitality businesses with reliable, ready-to-work professionals in minutes."

Primary buttons:

I Need Staff

I'm Ready to Work

Include:

How Bee Ready Works

Available Workers

Urgent Shifts

Why Choose Bee Ready

Testimonials clearly labelled as demo examples

Call to Action

Professional Footer

Worker Dashboard

Allow workers to:

Register and log in.

Create and edit a profile.

Choose hospitality roles and skills.

Add experience and preferred hourly rate.

Set an approximate work location and travel radius.

Toggle "Ready to Work" on or off.

Browse nearby available shifts.

Apply for shifts.

Accept or decline shift offers.

View confirmed and completed shifts.

View earnings estimates and ratings.

Business Dashboard

Allow businesses to:

Register and log in.

Create a business profile.

Post urgent staffing requests.

Specify role, shift time, pay, location, and number of workers needed.

Discover available workers.

Review applications.

Offer and confirm shifts.

Manage upcoming shifts.

View staffing history.

Main Feature: Bee Match

Create a smart matching system called Bee Match.

Match workers to available shifts based on:

Job role and skills.

Worker availability.

Distance.

Hourly rate.

Experience.

Shift timing.

Display match scores with explanations such as:

"95% Match — Experienced bartender, available tonight, within your travel radius."

Initially use a transparent, rule-based matching algorithm. Do not pretend that the scores come from a trained AI model.

Urgent Staffing

Create a prominent feature called Bee SOS.

Businesses can post emergency staffing requests.

Example:
"The Harbour Pub needs 2 bartenders tonight, 6 PM–11 PM, £16/hour."

Suitable workers should see an urgent-shift notification inside the app.

Interactive Map

Show nearby available shifts and approximate worker locations using Leaflet and OpenStreetMap.

Do not expose workers' exact home addresses.

Technical Requirements

Use:

React

TypeScript

Tailwind CSS

Supabase for authentication and PostgreSQL database

Leaflet for maps

Responsive design for desktop and mobile

Implement:

Role-based authentication

Worker profiles

Business profiles

Shift creation

Shift applications

Shift confirmation

Worker availability

Matching logic

Database access controls

Loading, empty, and error states

Use seeded demo accounts and realistic fictional hospitality businesses so the hackathon judges can try the product without complicated setup.

Clearly distinguish demo functionality from live functionality.

Important Hackathon Requirements

Build a functional MVP, not just a static landing page.

Prioritize this working flow:

Business posts an urgent shift.

Worker marks themselves available.

Bee Match identifies the opportunity.

Worker applies.

Business accepts.

Both dashboards show the confirmed shift.

Prevent overlapping bookings and unauthorized access to business or worker records.

Use a simple, maintainable architecture that can be completed during a hackathon.

Deliverables

Project architecture.

Database schema and Supabase SQL.

Complete frontend components.

Authentication and authorization.

Working shift posting and matching.

Demo data.

Local setup instructions.

Deployment instructions.

Three-minute MLH Hack for Humanity pitch.

Generate actual working code, not just explanations or mockups.

Start with the project structure and a polished landing page, then build the functional worker and business dashboards.

Keep the branding consistent with Bee Ready Agency throughout the application

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://beereadyagency.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1cb9916d-6528-5f55-9259-3446e72ff535).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
