using Crux.Data;
using Crux.Models.Entities;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace Crux.Services;

public class LessonService(ICardManagementService cardManagementService, ApplicationDbContext dbContext) : ILessonService
{
    public ICollection<LessonResponse> GetLessons()
    {
        var lessons = new List<LessonResponse>();
        
        dbContext.Lessons
            .ToList()
            .ForEach(lesson =>
            {
                lessons.Add(new LessonResponse
                {
                    Id = lesson.Id,
                    Title = lesson.Title,
                    BriefCards = cardManagementService.GetLessonCards(lesson.Id) 
                });
            });
        
        return lessons;
    }
    
    public async Task<ICollection<LessonResponse>> GetLessonsAsync()
    {
        var lessons = new List<LessonResponse>();
        
        var lessonEntities = await dbContext.Lessons.ToListAsync();
        
        foreach (var lesson in lessonEntities)
        {
            lessons.Add(new LessonResponse
            {
                Id = lesson.Id,
                Title = lesson.Title,
                BriefCards = await cardManagementService.GetLessonCardsAsync(lesson.Id)
            });
        }
        
        return lessons;
    }

    public LessonResponse AddLesson(string title)
    {
        var lesson = new Lesson { Title = title };
        dbContext.Lessons.Add(lesson);
        dbContext.SaveChanges();

        return new LessonResponse
        {
            Success = true,
            Id = lesson.Id,
            Title = lesson.Title
        };
    }
    
    public async Task<LessonResponse> AddLessonAsync(string title)
    {
        var lesson = new Lesson { Title = title };
        await dbContext.Lessons.AddAsync(lesson);
        await dbContext.SaveChangesAsync();

        return new LessonResponse
        {
            Success = true,
            Id = lesson.Id,
            Title = lesson.Title
        };
    }

    public LessonResponse UpdateLessonName(UpdateLessonRequest request)
    {
        var lesson = dbContext.Lessons.FirstOrDefault(l => l.Id == request.Id);
        if (lesson != null)
        {
            lesson.Title = request.Title;
            dbContext.SaveChanges();
            
            return new LessonResponse
            {
                Success = true,
                Id = lesson.Id,
                Title = lesson.Title,
            };
        }

        return new LessonResponse
        {
            Success = false,
            Error = "Lesson not found"
        };
    }
    
    public async Task<LessonResponse> UpdateLessonNameAsync(UpdateLessonRequest request)
    {
        var lesson = await dbContext.Lessons.FirstOrDefaultAsync(l => l.Id == request.Id);
        if (lesson != null)
        {
            lesson.Title = request.Title;
            await dbContext.SaveChangesAsync();
            
            return new LessonResponse
            {
                Success = true,
                Id = lesson.Id,
                Title = lesson.Title,
            };
        }

        return new LessonResponse
        {
            Success = false,
            Error = "Lesson not found"
        };
    }

    public bool DeleteLesson(int id)
    {
        var lesson = dbContext.Lessons.FirstOrDefault(l => l.Id == id);
        if (lesson != null)
        {
            dbContext.Lessons.Remove(lesson);
            dbContext.SaveChanges();
            return true;
        }
        
        return false;
    }
    
    public async Task<bool> DeleteLessonAsync(int id)
    {
        var lesson = await dbContext.Lessons.FirstOrDefaultAsync(l => l.Id == id);
        if (lesson != null)
        {
            dbContext.Lessons.Remove(lesson);
            await dbContext.SaveChangesAsync();
            return true;
        }
        
        return false;
    }
}
