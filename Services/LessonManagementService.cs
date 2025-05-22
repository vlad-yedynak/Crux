using Crux.Data;
using Crux.Models.Entities;
using Crux.Models.EntityTypes;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace Crux.Services;

public class LessonManagementService(
    IAuthenticationService authenticationService,
    ICardManagementService cardManagementService,
    ApplicationDbContext dbContext) : ILessonManagementService
{
    public ICollection<LessonResponse> GetLessons(HttpContext context)
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
                    BriefCards = cardManagementService.GetLessonCards(context, lesson.Id) 
                });
            });
        
        return lessons;
    }
    
    public async Task<ICollection<LessonResponse>> GetLessonsAsync(HttpContext context)
    {
        var lessons = new List<LessonResponse>();
        
        var lessonEntities = await dbContext.Lessons.ToListAsync();
        
        foreach (var lesson in lessonEntities)
        {
            lessons.Add(new LessonResponse
            {
                Id = lesson.Id,
                Title = lesson.Title,
                BriefCards = await cardManagementService.GetLessonCardsAsync(context, lesson.Id)
            });
        }
        
        return lessons;
    }

    public LessonResponse AddLesson(HttpContext context, string title)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new LessonResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }

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
    
    public async Task<LessonResponse> AddLessonAsync(HttpContext context, string title)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new LessonResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }

        var lesson = new Lesson { Title = title };
        dbContext.Lessons.Add(lesson);
        await dbContext.SaveChangesAsync();

        return new LessonResponse
        {
            Success = true,
            Id = lesson.Id,
            Title = lesson.Title
        };
    }

    public LessonResponse UpdateLessonName(HttpContext context, UpdateLessonRequest request)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;

            return new LessonResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }

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

        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return new LessonResponse
        {
            Success = false,
            Error = "Lesson not found"
        };
    }
    
    public async Task<LessonResponse> UpdateLessonNameAsync(HttpContext context, UpdateLessonRequest request)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;

            return new LessonResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }

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

        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return new LessonResponse
        {
            Success = false,
            Error = "Lesson not found"
        };
    }

    public bool DeleteLesson(HttpContext context, int id)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }
        
        var lesson = dbContext.Lessons.FirstOrDefault(l => l.Id == id);
        if (lesson != null)
        {
            dbContext.Lessons.Remove(lesson);
            dbContext.SaveChanges();
            return true;
        }
        
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return false;
    }
    
    public async Task<bool> DeleteLessonAsync(HttpContext context, int id)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }
        
        var lesson = await dbContext.Lessons.FirstOrDefaultAsync(l => l.Id == id);
        if (lesson != null)
        {
            dbContext.Lessons.Remove(lesson);
            await dbContext.SaveChangesAsync();
            return true;
        }
        
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return false;
    }
}
