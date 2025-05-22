using Crux.Data;
using Crux.Models.Entities;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace Crux.Services;

public class PersonalizationService(ApplicationDbContext dbContext) : IPersonalizationService
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

    // TODO: Create service for AI suggested feed content
    public UserFeedResponse GetUserFeed(int userId)
    {
        throw new NotImplementedException();
    }

    public Task<UserFeedResponse> GetUserFeedAsync(int userId)
    {
        throw new NotImplementedException();
    }
}
