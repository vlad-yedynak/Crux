using Crux.Data;
using Crux.Models.Entities;
using Crux.Models.EntityTypes;
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
        var lessons = await dbContext.Lessons
            .Include(l => l.Cards)
            .Select(l => new 
            {
                Lesson = l,
                Cards = l.Cards.Select(c => new { c.Id, c.Title, c.CardType, c.Description, c.LessonId })
            })
            .ToListAsync();
        
        var lessonIds = lessons.Select(l => l.Lesson.Id).ToList();
        var pointsData = await GetLessonsTotalPointsAsync(lessonIds);

        return lessons.Select(l => new LessonResponse
        {
            Success = true,
            Id = l.Lesson.Id,
            Title = l.Lesson.Title,
            TotalPoints = pointsData.GetValueOrDefault(l.Lesson.Id, 0),
            BriefCards = l.Cards.Select(c => new BriefCardResponse
            {
                Success = true,
                Id = c.Id,
                LessonId = c.LessonId,
                Title = c.Title,
                CardType = c.CardType.ToString(),
                Description = c.Description
            }).ToList()
        }).ToList();
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
    
    private async Task<Dictionary<int, int>> GetLessonsTotalPointsAsync(List<int> lessonIds)
    {
        var result = new Dictionary<int, int>();
        
        var sandboxPoints = await dbContext.Cards
            .Where(c => lessonIds.Contains(c.LessonId) && c.CardType == CardType.Sandbox)
            .Join(dbContext.Tasks, 
                c => c.Id, 
                t => t.SandboxCardId, 
                (c, t) => new { c.LessonId, t.Points })
            .GroupBy(x => x.LessonId)
            .Select(g => new { LessonId = g.Key, Points = g.Sum(x => x.Points) })
            .ToListAsync();
        
        var testPoints = await dbContext.Cards
            .Where(c => lessonIds.Contains(c.LessonId) && c.CardType == CardType.Test)
            .Join(dbContext.Questions,
                c => c.Id,
                q => q.TestCardId,
                (c, q) => new { c.LessonId, QuestionId = q.Id })
            .Join(dbContext.Answers.Where(a => a.IsCorrect),
                cq => cq.QuestionId,
                a => a.QuestionId,
                (cq, a) => new { cq.LessonId, a.Score })
            .GroupBy(x => new { x.LessonId, x.Score })
            .Select(g => new { g.Key.LessonId, g.Key.Score })
            .GroupBy(x => x.LessonId)
            .Select(g => new { LessonId = g.Key, Points = g.Sum(x => x.Score) })
            .ToListAsync();
        
        foreach (var item in sandboxPoints)
        {
            result[item.LessonId] = item.Points;
        }
        
        foreach (var item in testPoints)
        {
            if (result.ContainsKey(item.LessonId))
                result[item.LessonId] += item.Points;
            else
                result[item.LessonId] = item.Points;
        }
        
        return result;
    }

    private async Task<int> CalculateLessonTotalPointsAsync(int lessonId)
    {
        var points = await GetLessonsTotalPointsAsync(new List<int> { lessonId });
        return points.GetValueOrDefault(lessonId, 0);
    }
}
