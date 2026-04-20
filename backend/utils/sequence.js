import Counter from "../models/Counter.js";

const nextSequence = async (key, session = null) => {
  const options = {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  };

  if (session) {
    options.session = session;
  }

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    options
  );

  return counter.seq;
};

const buildYearRegNo = (date, sequence) => {
  const year2 = String(date.getFullYear()).slice(-2);
  return `${year2}/${String(sequence).padStart(4, "0")}`;
};

export { nextSequence, buildYearRegNo };
