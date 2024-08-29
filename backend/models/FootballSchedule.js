import mongoose from 'mongoose';

const footballScheduleSchema = new mongoose.Schema({
    team: { type: String, required: true },
    date: { type: Date, required: true },
    opponent: { type: String, required: true },
    location: { type: String, required: true },
    result: { type: String } // win/loss or score
});

export const FootballSchedule = mongoose.model('FootballSchedule', footballScheduleSchema);
