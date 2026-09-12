import { deskPair } from './desk-line-pair';

export const DESK_LINE_EVENTS_CATALOG = [
  deskPair('birthday-yours', 'birthday', 'birthday', 'Cake', '{{firstName}}, may today feel unmistakably yours.', 'Happy birthday — with your favourite people and your kind of plans.', { tone: 'festive' }),
  deskPair('birthday-year', 'birthday', 'birthday', 'Cake', 'Happy birthday, {{firstName}}. Here’s to a lovely year.', 'With good surprises and plenty to look forward to.', { tone: 'festive' }),
  deskPair('birthday-table', 'birthday', 'birthday', 'Cake', '{{firstName}}, hope your birthday has a good table.', 'The people and the plans that actually feel like you.', { tone: 'festive' }),
  deskPair('birthday-story', 'birthday', 'birthday', 'Cake', 'Happy birthday, {{firstName}}. May it leave a good story.', 'The kind you are glad happened, not just glad ended.', { tone: 'festive' }),

  deskPair('birthday-memorial-quiet', 'birthday_memorial', 'birthday', 'Smile', '{{firstName}}, wishing you a gentle birthday.', 'A quiet day can still be unmistakably yours.', { tone: 'memorial' }),
  deskPair('birthday-memorial-kind', 'birthday_memorial', 'birthday', 'Hand', 'Happy birthday, {{firstName}}. Wishing you a peaceful one.', 'With the people and the pace that suit you.', { tone: 'memorial' }),

  deskPair('first-day-welcome', 'first_day', 'first-day', 'Hand', '{{firstName}}, it’s good to have you here.', 'Here’s to unfamiliar faces becoming familiar ones.', { tone: 'warm' }),
  deskPair('first-day-names', 'first_day', 'first-day', 'Hand', 'Welcome, {{firstName}}. The names will start to stick.', 'Today only has to be a beginning.', { tone: 'warm' }),
  deskPair('first-day-corner', 'first_day', 'first-day', 'Compass', '{{firstName}}, glad this is your first day with us.', 'A quiet corner is a perfectly good place to start.', { tone: 'warm' }),

  deskPair('first-day-memorial', 'first_day_memorial', 'first-day', 'Hand', '{{firstName}}, it’s good to have you here.', 'Take the day as it comes. We are glad you arrived.', { tone: 'memorial' }),

  deskPair('anniversary-one', 'anniversary_one', 'anniversary', 'PartyPopper', 'A year together, {{firstName}}. Thank you.', 'Happy first work anniversary. It’s good to have you here.', { tone: 'festive' }),
  deskPair('anniversary-one-quiet', 'anniversary_one', 'anniversary', 'Smile', '{{firstName}}, one year in. Thank you for being here.', 'Happy first work anniversary — a good beginning kept.', { tone: 'warm' }),
  deskPair('anniversary-one-company', 'anniversary_one', 'anniversary', 'Hand', 'A year of good company, {{firstName}}. Thank you.', 'Happy first work anniversary.', { tone: 'warm' }),

  deskPair('anniversary-many', 'anniversary_many', 'anniversary', 'PartyPopper', '{{years}} years together, {{firstName}}. Thank you.', 'Happy work anniversary. Here’s to good company along the way.', { tone: 'festive' }),
  deskPair('anniversary-many-kept', 'anniversary_many', 'anniversary', 'Smile', '{{firstName}}, {{years}} years here. That is no small thing.', 'Happy work anniversary — and thank you.', { tone: 'warm' }),
  deskPair('anniversary-many-along', 'anniversary_many', 'anniversary', 'Hand', '{{years}} years along the way, {{firstName}}. Thank you.', 'Happy work anniversary. Glad you are still at the table.', { tone: 'warm' }),

  deskPair('anniversary-memorial', 'anniversary_memorial', 'anniversary', 'Hand', '{{firstName}}, thank you for being here.', 'A quiet note for a work anniversary. We are glad you are with us.', { tone: 'memorial' }),

  deskPair('onboarding-3', 'onboarding_3', 'onboarding', 'Hand', '{{firstName}}, hope each day feels a little more familiar.', 'A few more names, a few more friendly faces.'),
  deskPair('onboarding-3-map', 'onboarding_3', 'onboarding', 'Compass', 'Three days in, {{firstName}}. The map is still unfolding.', 'That is exactly where this part is meant to be.'),
  deskPair('onboarding-3-faces', 'onboarding_3', 'onboarding', 'Smile', '{{firstName}}, here’s to a few more faces making sense.', 'Familiarity arrives in small pieces.'),

  deskPair('onboarding-10', 'onboarding_10', 'onboarding', 'Compass', 'Here’s to finding your own way, {{firstName}}.', 'And having someone to ask when you need a hand.'),
  deskPair('onboarding-10-ask', 'onboarding_10', 'onboarding', 'Hand', '{{firstName}}, ten days in. Questions still count as progress.', 'Good rooms make asking easy.'),
  deskPair('onboarding-10-shape', 'onboarding_10', 'onboarding', 'Compass', 'Hope the place is starting to have a shape, {{firstName}}.', 'Ten days is a fair time for the outlines.'),

  deskPair('onboarding-21', 'onboarding_21', 'onboarding', 'Smile', '{{firstName}}, hope there have been some good surprises.', 'It’s good to have you as part of the team.'),
  deskPair('onboarding-21-team', 'onboarding_21', 'onboarding', 'Hand', 'Three weeks in, {{firstName}}. Glad you are part of this.', 'The team is better with you in it.'),
  deskPair('onboarding-21-keep', 'onboarding_21', 'onboarding', 'Smile', '{{firstName}}, here’s to the bits that already feel like yours.', 'Twenty-one days can do that quietly.'),

  deskPair('book-hard-to-leave', 'cultural', 'books', 'BookOpen', '{{firstName}}, may your next book be hard to put down.', 'It’s World Book Day. Here’s to “just one more page.”', { eventId: 'world-book-day', tone: 'warm' }),
  deskPair('book-evening', 'cultural', 'books', 'BookOpen', 'Here’s to a book that keeps you a little later.', 'World Book Day is a fine excuse, {{firstName}}.', { eventId: 'world-book-day', tone: 'warm' }),
  deskPair('book-finds-you', 'cultural', 'books', 'BookOpen', '{{firstName}}, hope a book finds you at the right time.', 'World Book Day — even one good page would do.', { eventId: 'world-book-day', tone: 'warm' }),

  deskPair('music-soundtrack', 'cultural', 'music', 'Music', '{{firstName}}, hope today comes with a better soundtrack.', 'It’s International Music Day. Play the one you keep returning to.', { eventId: 'international-music-day', tone: 'warm' }),
  deskPair('music-twice', 'cultural', 'music', 'Music', 'Here’s to a song worth playing twice.', 'International Music Day is permission enough, {{firstName}}.', { eventId: 'international-music-day', tone: 'warm' }),
  deskPair('music-finds-you', 'cultural', 'music', 'Music', '{{firstName}}, may a tune find you in the middle of the day.', 'International Music Day — even a borrowed chorus counts.', { eventId: 'international-music-day', tone: 'warm' }),

  deskPair('new-year-surprises', 'cultural', 'new-year', 'Sparkles', '{{firstName}}, here’s to a year with good surprises.', 'Happy New Year. Hope there’s plenty in it for you.', { eventId: 'new-year', tone: 'festive' }),
  deskPair('new-year-pages', 'cultural', 'new-year', 'Sparkles', 'Happy New Year, {{firstName}}. Fresh pages, filled in time.', 'Hope the year is generous in small ways.', { eventId: 'new-year', tone: 'festive' }),
  deskPair('new-year-kind', 'cultural', 'new-year', 'Smile', '{{firstName}}, wishing you a year that is kind in unexpected places.', 'Happy New Year — start it however you like.', { eventId: 'new-year', tone: 'festive' }),

  deskPair('new-year-eve-close', 'cultural', 'new-year', 'Sparkles', '{{firstName}}, here’s to closing the year kindly.', 'Hope the last page has something you are glad to keep.', { eventId: 'new-year-eve', tone: 'festive' }),
  deskPair('new-year-eve-light', 'cultural', 'new-year', 'Sparkles', 'The year is on its last evening, {{firstName}}.', 'A quiet close is still a good close.', { eventId: 'new-year-eve', tone: 'warm' }),
  deskPair('new-year-eve-forward', 'cultural', 'new-year', 'Smile', '{{firstName}}, hope tonight holds a little looking-forward.', 'The next year can wait until it arrives.', { eventId: 'new-year-eve', tone: 'warm' }),

  deskPair('independence-quiet', 'cultural', 'armenia', 'Sparkles', '{{firstName}}, a proud quiet day on the calendar.', 'Independence Day — however you mark it, we hope it is a good one.', { eventId: 'armenia-independence', tone: 'warm' }),
  deskPair('independence-company', 'cultural', 'armenia', 'Smile', 'A national day, and still a human one, {{firstName}}.', 'Hope it holds something simple and good.', { eventId: 'armenia-independence', tone: 'warm' }),
  deskPair('independence-here', 'cultural', 'armenia', 'Hand', '{{firstName}}, glad to share this date with you here.', 'Independence Day — wishing you a steady, decent one.', { eventId: 'armenia-independence', tone: 'warm' }),

  deskPair('memorial-peaceful', 'memorial_neutral', 'peaceful', 'None', 'Wishing you a peaceful day, {{firstName}}.', 'A little room for what matters to you.', { tone: 'memorial' }),
  deskPair('memorial-room', 'memorial_neutral', 'peaceful', 'None', '{{firstName}}, wishing you a quiet, decent day.', 'Take it at the pace that feels right.', { tone: 'memorial' }),
  deskPair('memorial-plain', 'memorial_neutral', 'peaceful', 'None', 'A quiet day is enough.', 'No need to fill it with more than it holds.', { tone: 'memorial' }),
] as const;
