using Crux.Data;
using Crux.Models.Entities;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace Crux.Services;

public class PersonalizationService(ApplicationDbContext dbContext, IUserFeedService userFeedService) : IPersonalizationService
{
    public PersonalizationResponse UpdateLessonTime(int userId, PersonalizationRequest request)
    {
        var user =  dbContext.Users.FirstOrDefault(u => u.Id == userId);
        if (user == null)
        {
            return new PersonalizationResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "User not found"
            };
        }
        
        var lesson =  dbContext.Lessons.FirstOrDefault(l => l.Id == request.LessonId);
        if (lesson == null)
        {
            return new PersonalizationResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "Lesson not found"
            };
        }

        var tracker = dbContext.LessonTrackers.FirstOrDefault(t => t.LessonId == request.LessonId && t.UserId == userId);
        if (tracker == null)
        {
            dbContext.LessonTrackers.Add(new LessonTracker
            {
                UserId = request.UserId,
                LessonId = request.LessonId,
                TrackedTime = request.TrackedTime
            });
            
            dbContext.SaveChanges();
            
            return new PersonalizationResponse
            {
                TrackedTime = request.TrackedTime,
                Success = true
            };
        }
        
        tracker.TrackedTime += request.TrackedTime;
        dbContext.SaveChanges();
        
        return new PersonalizationResponse
        {
            TrackedTime = tracker.TrackedTime,
            Success = true
        };
    }
    
    public async Task<PersonalizationResponse> UpdateLessonTimeAsync(int userId, PersonalizationRequest request)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            return new PersonalizationResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "User not found"
            };
        }
        
        var lesson = await dbContext.Lessons.FirstOrDefaultAsync(l => l.Id == request.LessonId);
        if (lesson == null)
        {
            return new PersonalizationResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "Lesson not found"
            };
        }

        var tracker = await dbContext.LessonTrackers.FirstOrDefaultAsync(t => t.LessonId == request.LessonId && t.UserId == userId);
        if (tracker == null)
        {
            await dbContext.LessonTrackers.AddAsync(new LessonTracker
            {
                UserId = request.UserId,
                LessonId = request.LessonId,
                TrackedTime = request.TrackedTime
            });
            
            await dbContext.SaveChangesAsync();
            
            return new PersonalizationResponse
            {
                TrackedTime = request.TrackedTime,
                Success = true
            };
        }
        
        tracker.TrackedTime += request.TrackedTime;
        await dbContext.SaveChangesAsync();
        
        return new PersonalizationResponse
        {
            TrackedTime = tracker.TrackedTime,
            Success = true
        };
    }

    public PersonalizationResponse ResetLessonTime(int userId, int lessonId)
    {
        var user =  dbContext.Users.FirstOrDefault(u => u.Id == userId);
        if (user == null)
        {
            return new PersonalizationResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "User not found"
            };
        }
        
        var lesson =  dbContext.Lessons.FirstOrDefault(l => l.Id == lessonId);
        if (lesson == null)
        {
            return new PersonalizationResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "Lesson not found"
            };
        }

        var tracker = dbContext.LessonTrackers.FirstOrDefault(t => t.LessonId == lessonId && t.UserId == userId);
        if (tracker == null)
        {
            return new PersonalizationResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "User has no tracked time in lesson"
            };
        }
        
        tracker.TrackedTime = 0;
        dbContext.SaveChanges();
        return new PersonalizationResponse
        {
            TrackedTime = tracker.TrackedTime,
            Success = true
        };
    }
    
    public async Task<PersonalizationResponse> ResetLessonTimeAsync(int userId, int lessonId)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            return new PersonalizationResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "User not found"
            };
        }
        
        var lesson = await dbContext.Lessons.FirstOrDefaultAsync(l => l.Id == lessonId);
        if (lesson == null)
        {
            return new PersonalizationResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "Lesson not found"
            };
        }

        var tracker = await dbContext.LessonTrackers.FirstOrDefaultAsync(t => t.LessonId == lessonId && t.UserId == userId);
        if (tracker == null)
        {
            return new PersonalizationResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "User has no tracked time in lesson"
            };
        }
        
        tracker.TrackedTime = 0;
        await dbContext.SaveChangesAsync();
        return new PersonalizationResponse
        {
            TrackedTime = tracker.TrackedTime,
            Success = true
        };
    }

    public PersonalizationResponse ResetAll(int userId)
    { 
        var user =  dbContext.Users.FirstOrDefault(u => u.Id == userId);
        if (user == null)
        {
            return new PersonalizationResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "User not found"
            };
        }
        
        var userTrackers = dbContext.LessonTrackers
            .Where(t => t.UserId == userId)
            .ToList();
        
        foreach (var tracker in userTrackers)
        { 
            tracker.TrackedTime = 0;
        }
        
        dbContext.SaveChanges();

        return new PersonalizationResponse
        {
            TrackedTime = 0,
            Success = true
        };
    }
    
    public async Task<PersonalizationResponse> ResetAllAsync(int userId)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            return new PersonalizationResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "User not found"
            };
        }
        
        var userTrackers = await dbContext.LessonTrackers
            .Where(t => t.UserId == userId)
            .ToListAsync();
        
        foreach (var tracker in userTrackers)
        {
            tracker.TrackedTime = 0;
        }
        
        await dbContext.SaveChangesAsync();

        return new PersonalizationResponse
        {
            TrackedTime = 0,
            Success = true
        };
    }

    public ICollection<UserFeedResponse> GetUserFeed(int userId)
    {
        return [];
    }

    public async Task<ICollection<UserFeedResponse>> GetUserFeedAsync(int userId)
    {
        var user =  await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            return [];
        }
        
        var lesson = await GetMostRelevantLessonAsync(user);
        if (lesson == null)
        {
            return [];
        }
        
        var lessonTopic = GetLessonDetailedTopic(lesson);
        
        return await userFeedService.GetLearningResourcesAsync(lessonTopic);
    }

    private async Task<Lesson?> GetMostRelevantLessonAsync(User user)
    {
        var mostRelevantLessonTracker = await dbContext.LessonTrackers
            .Where(t => t.UserId == user.Id) // Ensure TrackedTime has a value
            .OrderByDescending(t => t.TrackedTime)
            .FirstOrDefaultAsync();

        if (mostRelevantLessonTracker == null)
        {
            return null;
        }

        var lesson = await dbContext.Lessons
            .Include(l => l.Cards)
            .FirstOrDefaultAsync(l => l.Id == mostRelevantLessonTracker.LessonId);
        
        return lesson;
    }

    private static string GetLessonDetailedTopic(Lesson lesson)
    {
        var detailedTopic = lesson.Title;

        if (lesson.Cards.Count != 0)
        {
            var cardTitles = lesson.Cards
                .Select(card => card.Title)
                .Where(title => !string.IsNullOrEmpty(title))
                .ToList();
            
            if (cardTitles.Count != 0)
            {
                detailedTopic += ": " + string.Join(", ", cardTitles);
            }
        }
        
        return detailedTopic;
    }
}
