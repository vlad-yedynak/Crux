using System.Net.Mail;
using Crux.Data;
using Crux.Extensions;
using Crux.Models.Cards;
using Crux.Models.Entities;
using Crux.Models.EntityTypes;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace Crux.Services;

public class LessonService(
    IAuthenticationService authenticationService,
    ApplicationDbContext dbContext) : ILessonService
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
                    BriefCards = GetLessonCardsBrief(context, lesson.Id)
                });
            } );
        
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
                BriefCards = await GetLessonCardsBriefAsync(context, lesson.Id)
            });
        }
        
        return lessons;
    }
    
    private List<BriefCardResponse> GetLessonCardsBrief(HttpContext context, int lessonId)
    {
        var lesson = dbContext.Lessons
            .Include(lesson => lesson.Cards)
            .FirstOrDefault(lesson => lesson.Id == lessonId);

        if (lesson == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return [];
        }
        
        var cardsInfo = new List<BriefCardResponse>();
        
        lesson.Cards
            .ToList()
            .ForEach(card => cardsInfo.Add(GetCardBrief(context, card.Id)));
        
        return cardsInfo;
    }
    
    private async Task<List<BriefCardResponse>> GetLessonCardsBriefAsync(HttpContext context, int lessonId)
    {
        var lesson = await dbContext.Lessons
            .Include(lesson => lesson.Cards)
            .FirstOrDefaultAsync(lesson => lesson.Id == lessonId);

        if (lesson == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return [];
        }
        
        var cardsInfo = new List<BriefCardResponse>();

        foreach (var card in lesson.Cards)
        {
            cardsInfo.Add(await GetCardBriefAsync(context, card.Id));
        }
        
        return cardsInfo;
    }
    
    public BriefCardResponse GetCardBrief(HttpContext context, int id)
    {
        var card = dbContext.Cards.FirstOrDefault(card => card.Id == id);

        if (card == null)
        {
            return new FullCardResponse
            {
                Success = false,
                Error = "Card not found"
            };
        }

        return new BriefCardResponse
        {
            Success = true,
            Id = card.Id,
            LessonId = card.LessonId,
            Title = card.Title,
            CardType = card.CardType.ToString(),
            Description = card.Description
        };
    }
    
    public async Task<BriefCardResponse> GetCardBriefAsync(HttpContext context, int id)
    {
        var card = await dbContext.Cards.FirstOrDefaultAsync(card => card.Id == id);

        if (card == null)
        {
            return new FullCardResponse
            {
                Success = false,
                Error = "Card not found"
            };
        }

        return new BriefCardResponse
        {
            Success = true,
            Id = card.Id,
            LessonId = card.LessonId,
            Title = card.Title,
            CardType = card.CardType.ToString(),
            Description = card.Description
        };
    }
    
    public FullCardResponse GetCardFull(HttpContext context, int id)
    {
        if (!authenticationService.CheckAuthentication(context))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new FullCardResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var card = dbContext.Cards.FirstOrDefault(card => card.Id == id);

        if (card == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            
            return new FullCardResponse
            {
                Success = false,
                Error = "Card not found"
            };
        }
        
        var userId = authenticationService.GetUserIdFromContext(context);

        return new FullCardResponse
        {
            Success = true,
            Id = card.Id,
            LessonId = card.LessonId,
            Title = card.Title,
            CardType = card.CardType.ToString(),
            Description = card.Description,
            EducationalData = card is EducationalCard educationalCard ? GetEducationalData(educationalCard.Id) : null,
            Questions = card is TestCard ? GetQuestions(userId, card.Id) : null,
            Tasks = card is SandboxCard ? GetTasks(userId, card.Id) : null,
            SandboxType = card is SandboxCard sandboxCard ? sandboxCard.Type.ToString() : null
        };
    }
    
    public async Task<FullCardResponse> GetCardFullAsync(HttpContext context, int id)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new FullCardResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var card = await dbContext.Cards.FirstOrDefaultAsync(card => card.Id == id);

        if (card == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            
            return new FullCardResponse
            {
                Success = false,
                Error = "Card not found"
            };
        }
        
        var userId = await authenticationService.GetUserIdFromContextAsync(context);

        return new FullCardResponse
        {
            Success = true,
            Id = card.Id,
            LessonId = card.LessonId,
            Title = card.Title,
            CardType = card.CardType.ToString(),
            Description = card.Description,
            EducationalData = card is EducationalCard educationalCard ? await GetEducationalDataAsync(educationalCard.Id) : null,
            Questions = card is TestCard ? await GetQuestionsAsync(userId, card.Id) : null,
            Tasks = card is SandboxCard ? await GetTasksAsync(userId, card.Id) : null,
            SandboxType = card is SandboxCard sandboxCard ? sandboxCard.Type.ToString() : null
        };
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
        
        if (dbContext.Lessons.Any(l => l.Id == id))
        {
            dbContext.Lessons.Where(l => l.Id == id).ExecuteDelete();   
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
        
        if (await dbContext.Lessons.AnyAsync(l => l.Id == id))
        {
            await dbContext.Lessons.Where(l => l.Id == id).ExecuteDeleteAsync();   
            await dbContext.SaveChangesAsync();
            return true;
        }
        
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return false;
    }

    public FullCardResponse AddCard(HttpContext context, CardRequest cardRequest)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new FullCardResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var lesson = dbContext.Lessons.FirstOrDefault(l => l.Id == cardRequest.LessonId);
        if (lesson == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            
            return new FullCardResponse
            {
                Success = false,
                Error = "Invalid lesson id"
            };
        }
        
        switch (cardRequest.CardType.ToCardType())
        {
            case CardType.Educational:
                dbContext.EducationalCards.Add(new EducationalCard
                {
                    Title = cardRequest.Title,
                    CardType = cardRequest.CardType.ToCardType(),
                    Description = cardRequest.Description,
                    LessonId = cardRequest.LessonId
                });
                
                break;
            case CardType.Test:
                dbContext.TestCards.Add(new TestCard
                {
                    Title = cardRequest.Title,
                    CardType = cardRequest.CardType.ToCardType(),
                    Description = cardRequest.Description,
                    LessonId = cardRequest.LessonId
                });
                
                break;
            case CardType.Sandbox:
                dbContext.SandboxCards.Add(new SandboxCard
                {
                    Title = cardRequest.Title,
                    CardType = cardRequest.CardType.ToCardType(),
                    Description = cardRequest.Description,
                    LessonId = cardRequest.LessonId
                });
                
                break;
            default:
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                
                return new FullCardResponse
                {
                    Success = false,
                    Error = "Invalid card type"
                };
        }
        
        dbContext.SaveChanges();
        
        return new FullCardResponse
        {
            Success = true
        };
    }
    
    public async Task<FullCardResponse> AddCardAsync(HttpContext context, CardRequest cardRequest)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new FullCardResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var lesson = await dbContext.Lessons.FirstOrDefaultAsync(l => l.Id == cardRequest.LessonId);
        if (lesson == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            
            return new FullCardResponse
            {
                Success = false,
                Error = "Invalid lesson id"
            };
        }
        
        switch (cardRequest.CardType.ToCardType())
        {
            case CardType.Educational:
                dbContext.EducationalCards.Add(new EducationalCard
                {
                    Title = cardRequest.Title,
                    CardType = cardRequest.CardType.ToCardType(),
                    Description = cardRequest.Description,
                    LessonId = cardRequest.LessonId
                });
                
                break;
            case CardType.Test:
                dbContext.TestCards.Add(new TestCard
                {
                    Title = cardRequest.Title,
                    CardType = cardRequest.CardType.ToCardType(),
                    Description = cardRequest.Description,
                    LessonId = cardRequest.LessonId
                });
                
                break;
            case CardType.Sandbox:
                dbContext.SandboxCards.Add(new SandboxCard
                {
                    Title = cardRequest.Title,
                    CardType = cardRequest.CardType.ToCardType(),
                    Description = cardRequest.Description,
                    LessonId = cardRequest.LessonId
                });
                
                break;
            default:
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                
                return new FullCardResponse
                {
                    Success = false,
                    Error = "Invalid card type"
                };
        }
        
        await dbContext.SaveChangesAsync();
        
        return new FullCardResponse
        {
            Success = true
        };
    }

    public FullCardResponse UpdateCard(HttpContext context, CardRequest cardRequest)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new FullCardResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }

        if (cardRequest.Id == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            
            return new FullCardResponse
            {
                Success = false,
                Error = "Card is not provided"
            };
        }
        
        var card = dbContext.Cards.FirstOrDefault(c => c.Id == cardRequest.Id);

        if (card == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            
            return new FullCardResponse
            {
                Success = false,
                Error = "Invalid card id"
            };
        }
        
        var lesson = dbContext.Lessons.FirstOrDefault(l => l.Id == cardRequest.LessonId);
        if (lesson == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;

            return new FullCardResponse
            {
                Success = false,
                Error = "Invalid lesson id"
            };
        }
        
        card.Title = cardRequest.Title;
        card.Description = cardRequest.Description;
        card.LessonId = cardRequest.LessonId;
        
        dbContext.SaveChanges();
        
        return new FullCardResponse
        {
            Success = true,
            Id = card.Id,
            LessonId = card.LessonId,
            Title = card.Title,
            CardType = card.CardType.ToString(),
            Description = card.Description
        };
    }
    
    public async Task<FullCardResponse> UpdateCardAsync(HttpContext context, CardRequest cardRequest)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new FullCardResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }

        if (cardRequest.Id == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            
            return new FullCardResponse
            {
                Success = false,
                Error = "Card is not provided"
            };
        }
        
        var card = await dbContext.Cards.FirstOrDefaultAsync(c => c.Id == cardRequest.Id);

        if (card == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            
            return new FullCardResponse
            {
                Success = false,
                Error = "Invalid card id"
            };
        }
        
        var lesson = await dbContext.Lessons.FirstOrDefaultAsync(l => l.Id == cardRequest.LessonId);
        if (lesson == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;

            return new FullCardResponse
            {
                Success = false,
                Error = "Invalid lesson id"
            };
        }
        
        card.Title = cardRequest.Title;
        card.Description = cardRequest.Description;
        card.LessonId = cardRequest.LessonId;
        
        await dbContext.SaveChangesAsync();
        
        return new FullCardResponse
        {
            Success = true,
            Id = card.Id,
            LessonId = card.LessonId,
            Title = card.Title,
            CardType = card.CardType.ToString(),
            Description = card.Description
        };
    }

    public bool DeleteCard(HttpContext context, int id)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }

        if (dbContext.Cards.Any(c => c.Id == id))
        {
            dbContext.Cards.Where(c => c.Id == id).ExecuteDelete();   
            dbContext.SaveChanges();
            return true;
        }
        
        return false;
    }
    
    public async Task<bool> DeleteCardAsync(HttpContext context, int id)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }

        if (await dbContext.Cards.AnyAsync(c => c.Id == id))
        {
            await dbContext.Cards.Where(c => c.Id == id).ExecuteDeleteAsync();   
            await dbContext.SaveChangesAsync();
            return true;
        }
        
        return false;
    }


    private List<QuestionResponse> GetQuestions(int? userId, int cardId)
    {
        var card = dbContext.TestCards.Include(card => card.Questions)
            .FirstOrDefault(card => card.Id == cardId);
        var questionsInfo = new List<QuestionResponse>();

        if (card == null)
        {
            return [];
        }

        card.Questions.ToList().ForEach(question =>
        {
            questionsInfo.Add(GetQuestionInfo(userId, question.Id));
        });
        
        return questionsInfo;
    }
    
    private async Task<List<QuestionResponse>> GetQuestionsAsync(int? userId, int cardId)
    {
        var card = await dbContext.TestCards.Include(card => card.Questions)
            .FirstOrDefaultAsync(card => card.Id == cardId);
        var questionsInfo = new List<QuestionResponse>();

        if (card == null)
        {
            return [];
        }

        foreach (var question in card.Questions)
        {
            var questionInfo = await GetQuestionInfoAsync(userId, question.Id);
            questionsInfo.Add(questionInfo);
        }
        
        return questionsInfo;
    }
    
    private List<TaskResponse> GetTasks(int? userId, int cardId)
    {
        var card = dbContext.SandboxCards.Include(card => card.Tasks)
            .FirstOrDefault(card => card.Id == cardId);
        var tasksInfo = new List<TaskResponse>();

        if (card == null)
        {
            return [];
        }

        card.Tasks.ToList().ForEach(task =>
        {
            tasksInfo.Add(GetTaskInfo(userId, task.Id));
        });
        
        return tasksInfo;
    }
    
    private async Task<List<TaskResponse>> GetTasksAsync(int? userId, int cardId)
    {
        var card = await dbContext.SandboxCards.Include(card => card.Tasks)
            .FirstOrDefaultAsync(card => card.Id == cardId);
        var tasksInfo = new List<TaskResponse>();

        if (card == null)
        {
            return [];
        }

        foreach (var task in card.Tasks)
        {
            var taskInfo = await GetTaskInfoAsync(userId, task.Id);
            tasksInfo.Add(taskInfo);
        }
        
        return tasksInfo;
    }

    private QuestionResponse GetQuestionInfo(int? userId, int id)
    {
        var question = dbContext.Questions.FirstOrDefault(question => question.Id == id);

        if (question == null)
        {
            return new QuestionResponse
            {
                Success = false,
                Error = "Question not found"
            };
        }
        
        var isCompleted = dbContext.UserQuestionProgresses.Any(progress => progress.UserId == userId 
                                                                           && progress.QuestionId == id);

        return new QuestionResponse
        {
            Success = true,
            Id = question.Id,
            QuestionText = question.QuestionText,
            Answers = GetAnswers(question.Id),
            IsCompleted = isCompleted
        };
    }
    
    private async Task<QuestionResponse> GetQuestionInfoAsync(int? userId, int id)
    {
        var question = await dbContext.Questions.FirstOrDefaultAsync(question => question.Id == id);

        if (question == null)
        {
            return new QuestionResponse
            {
                Success = false,
                Error = "Question not found"
            };
        }
        
        var isCompleted = await dbContext.UserQuestionProgresses.AnyAsync(progress => progress.UserId == userId 
                                                                           && progress.QuestionId == id);

        return new QuestionResponse
        {
            Success = true,
            Id = question.Id,
            QuestionText = question.QuestionText,
            Answers = await GetAnswersAsync(question.Id),
            IsCompleted = isCompleted
        };
    }
    
    private TaskResponse GetTaskInfo(int? userId, int id)
    {
        var task = dbContext.Tasks.FirstOrDefault(task => task.Id == id);

        if (task == null)
        {
            return new TaskResponse
            {
                Success = false,
                Error = "Question not found"
            };
        }
        
        var isCompleted = dbContext.UserTaskProgresses.Any(progress => progress.UserId == userId
                                                                       && progress.TaskId == id);

        return new TaskResponse
        {
            Success = true,
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Points = task.Points,
            IsCompleted = isCompleted
        };
    }
    
    private async Task<TaskResponse> GetTaskInfoAsync(int? userId, int id)
    {
        var task = await dbContext.Tasks.FirstOrDefaultAsync(task => task.Id == id);

        if (task == null)
        {
            return new TaskResponse
            {
                Success = false,
                Error = "Question not found"
            };
        }
        
        var isCompleted = await dbContext.UserTaskProgresses.AnyAsync(progress => progress.UserId == userId
                                                                       && progress.TaskId == id);

        return new TaskResponse
        {
            Success = true,
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Points = task.Points,
            IsCompleted = isCompleted
        };
    }

    private List<AnswerResponse> GetAnswers(int questionId)
    {
        var question = dbContext.Questions.Include(question => question.Answers)
            .FirstOrDefault(question  => question.Id == questionId);
        var answersInfo = new List<AnswerResponse>();

        if (question == null)
        {
            return [];
        }

        question.Answers.ToList().ForEach(answer =>
        {
            answersInfo.Add(GetAnswerInfo(answer.Id));
        });
        
        return answersInfo;
    }
    
    private async Task<List<AnswerResponse>> GetAnswersAsync(int questionId)
    {
        var question = await dbContext.Questions.Include(question => question.Answers)
            .FirstOrDefaultAsync(question  => question.Id == questionId);
        var answersInfo = new List<AnswerResponse>();

        if (question == null)
        {
            return [];
        }

        foreach (var answer in question.Answers)
        {
            answersInfo.Add(await GetAnswerInfoAsync(answer.Id));
        }
        
        return answersInfo;
    }

    private AnswerResponse GetAnswerInfo(int id)
    {
        var answer = dbContext.Answers.FirstOrDefault(question => question.Id == id);

        if (answer == null)
        {
            return new AnswerResponse
            {
                Success = false,
                Error = "Answer not found"
            };
        }

        return new AnswerResponse
        {
            Success = true,
            Id = answer.Id,
            Score = answer.Score,
            AnswerText = answer.AnswerText
        };
    }
    
    private async Task<AnswerResponse> GetAnswerInfoAsync(int id)
    {
        var answer = await dbContext.Answers.FirstOrDefaultAsync(question => question.Id == id);

        if (answer == null)
        {
            return new AnswerResponse
            {
                Success = false,
                Error = "Answer not found"
            };
        }

        return new AnswerResponse
        {
            Success = true,
            Id = answer.Id,
            Score = answer.Score,
            AnswerText = answer.AnswerText
        };
    }

    public QuestionResponse AddQuestion(HttpContext context, QuestionRequest questionRequest)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new QuestionResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var testCard = dbContext.TestCards.FirstOrDefault(tc => tc.Id == questionRequest.TestCardId);

        if (testCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new QuestionResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }

        var question = new Question
        {
            TestCardId = questionRequest.TestCardId,
            QuestionText = questionRequest.QuestionText
        };

        dbContext.Questions.Add(question);
        dbContext.SaveChanges();
        
        dbContext.Answers.AddRange(
            questionRequest.Answers.Select(a => new Answer
            {
                QuestionId = question.Id,
                AnswerText = a.AnswerText,
                Score = a.Score,
                IsCorrect = a.IsCorrect
            })
        );

        dbContext.SaveChanges();

        return new QuestionResponse
        {
            Success = true,
            Id = question.Id,
            QuestionText = question.QuestionText,
            Answers = dbContext.Answers
                .Where(a => a.QuestionId == question.Id)
                .Select(a => new AnswerResponse
                {
                    Id = a.Id,
                    AnswerText = a.AnswerText,
                    Success = true
                })
                .ToList()
        };
    }
    
    public async Task<QuestionResponse> AddQuestionAsync(HttpContext context, QuestionRequest questionRequest)
    {
        if (! await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new QuestionResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var testCard = await dbContext.TestCards.FirstOrDefaultAsync(tc => tc.Id == questionRequest.TestCardId);

        if (testCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new QuestionResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }

        var question = new Question
        {
            TestCardId = questionRequest.TestCardId,
            QuestionText = questionRequest.QuestionText
        };

        dbContext.Questions.Add(question);
        await dbContext.SaveChangesAsync();
        
        await dbContext.Answers.AddRangeAsync(
            questionRequest.Answers.Select(a => new Answer
            {
                QuestionId = question.Id,
                AnswerText = a.AnswerText,
                Score = a.Score,
                IsCorrect = a.IsCorrect
            })
        );

        await dbContext.SaveChangesAsync();

        return new QuestionResponse
        {
            Success = true,
            Id = question.Id,
            QuestionText = question.QuestionText,
            Answers = await dbContext.Answers
                .Where(a => a.QuestionId == question.Id)
                .Select(a => new AnswerResponse
                {
                    Id = a.Id,
                    AnswerText = a.AnswerText,
                    Success = true
                })
                .ToListAsync()
        };
    }

    public QuestionResponse UpdateQuestion(HttpContext context, QuestionRequest questionRequest)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new QuestionResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }

        if (!questionRequest.Id.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new QuestionResponse
            {
                Success = false,
                Error = "Question not provided"
            };
        }
        
        var testCard = dbContext.TestCards.FirstOrDefault(tc => tc.Id == questionRequest.TestCardId);

        if (testCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new QuestionResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }
        
        var question = dbContext.Questions.FirstOrDefault(question => question.Id == questionRequest.Id);

        if (question == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new QuestionResponse
            {
                Success = false,
                Error = "Question not found"
            };
        }

        question.TestCardId = questionRequest.TestCardId;
        question.QuestionText = questionRequest.QuestionText;

        var existingAnswers = dbContext.Answers.Where(a => a.QuestionId == question.Id);
        dbContext.Answers.RemoveRange(existingAnswers);

        if (questionRequest.Answers != null)
        {
            var newAnswers = questionRequest.Answers.Select(a => new Answer
            {
                QuestionId = question.Id,
                AnswerText = a.AnswerText,
                Score = a.Score,
                IsCorrect = a.IsCorrect
            }).ToList();
            dbContext.Answers.AddRange(newAnswers);
        }

        dbContext.SaveChanges();

        return new QuestionResponse
        {
            Success = true,
            Id = question.Id,
            QuestionText = question.QuestionText,
            Answers = dbContext.Answers
                .Where(a => a.QuestionId == question.Id)
                .Select(a => new AnswerResponse
                {
                    Id = a.Id,
                    AnswerText = a.AnswerText,
                    Success = true
                })
                .ToList()
        };
    }
    
    public async Task<QuestionResponse> UpdateQuestionAsync(HttpContext context, QuestionRequest questionRequest)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new QuestionResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }

        if (!questionRequest.Id.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new QuestionResponse
            {
                Success = false,
                Error = "Question not provided"
            };
        }
        
        var testCard = await dbContext.TestCards.FirstOrDefaultAsync(tc => tc.Id == questionRequest.TestCardId);

        if (testCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new QuestionResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }
        
        var question = await dbContext.Questions.FirstOrDefaultAsync(question => question.Id == questionRequest.Id);

        if (question == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new QuestionResponse
            {
                Success = false,
                Error = "Question not found"
            };
        }

        question.TestCardId = questionRequest.TestCardId;
        question.QuestionText = questionRequest.QuestionText;

        var existingAnswers = dbContext.Answers.Where(a => a.QuestionId == question.Id);
        dbContext.Answers.RemoveRange(existingAnswers);

        if (questionRequest.Answers != null)
        {
            var newAnswers = questionRequest.Answers.Select(a => new Answer
            {
                QuestionId = question.Id,
                AnswerText = a.AnswerText,
                Score = a.Score,
                IsCorrect = a.IsCorrect
            }).ToList();
            await dbContext.Answers.AddRangeAsync(newAnswers);
        }

        await dbContext.SaveChangesAsync();

        return new QuestionResponse
        {
            Success = true,
            Id = question.Id,
            QuestionText = question.QuestionText,
            Answers = await dbContext.Answers
                .Where(a => a.QuestionId == question.Id)
                .Select(a => new AnswerResponse
                {
                    Id = a.Id,
                    AnswerText = a.AnswerText,
                    Success = true
                })
                .ToListAsync()
        };
    }

    public bool DeleteQuestion(HttpContext context, int id)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }

        if (dbContext.Questions.Any(q => q.Id == id))
        {
            dbContext.Questions.Where(q => q.Id == id).ExecuteDelete();
            dbContext.SaveChanges();
            return true;
        }
        
        return false;
    }
    
    public async Task<bool> DeleteQuestionAsync(HttpContext context, int id)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }

        if (await dbContext.Questions.AnyAsync(q => q.Id == id))
        {
            await dbContext.Questions.Where(q => q.Id == id).ExecuteDeleteAsync();
            await dbContext.SaveChangesAsync();
            return true;
        }
        
        return false;
    }
    
    public EducationalDataResponse AddEducationalData(HttpContext context, EducationalCardDataRequest educationalCardDataRequest)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var educationalCard = dbContext.EducationalCards.
            Include(ec => ec.Images).
            Include(ec => ec.Attachments).
            FirstOrDefault(ec => ec.Id == educationalCardDataRequest.CardId);

        if (educationalCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }
        
        educationalCard.Content = educationalCardDataRequest.Content;
        
        educationalCard.Images.Clear();
        educationalCard.Attachments.Clear();

        if (educationalCardDataRequest.Images != null && educationalCardDataRequest.Images.Any())
        {
            var image = educationalCardDataRequest.Images.Select(imageRequest => new CardImage
            {
                Url = imageRequest.Url,
                Caption = imageRequest.Caption,
                AltText = imageRequest.AltText,
                EducationalCardId = educationalCard.Id
            }).ToList();
            educationalCard.Images.AddRange(image);
        }

        if (educationalCardDataRequest.Attachments != null && educationalCardDataRequest.Attachments.Any())
        {
            var attachment = educationalCardDataRequest.Attachments.Select(attachmentRequest => new CardAttachment
            {
                Url = attachmentRequest.Url,
                Description = attachmentRequest.Description,
                EducationalCardId = educationalCard.Id
            }).ToList();
            educationalCard.Attachments.AddRange(attachment);
        }
        
        dbContext.SaveChanges();

        return new EducationalDataResponse
        {
            Success = true,
            CardId = educationalCard.Id,
            Content = educationalCard.Content,
            Images = educationalCard.Images,
            Attachments = educationalCard.Attachments
        };

    }
    
    public async Task<EducationalDataResponse> AddEducationalDataAsync(HttpContext context, EducationalCardDataRequest educationalCardDataRequest)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var educationalCard = await dbContext.EducationalCards.
            Include(ec => ec.Images).
            Include(ec => ec.Attachments).
            FirstOrDefaultAsync(ec => ec.Id == educationalCardDataRequest.CardId);

        if (educationalCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }
        
        educationalCard.Content = educationalCardDataRequest.Content;
        
        educationalCard.Images.Clear();
        educationalCard.Attachments.Clear();

        if (educationalCardDataRequest.Images != null && educationalCardDataRequest.Images.Any())
        {
            var image = educationalCardDataRequest.Images.Select(imageRequest => new CardImage
            {
                Url = imageRequest.Url,
                Caption = imageRequest.Caption,
                AltText = imageRequest.AltText,
                EducationalCardId = educationalCard.Id
            }).ToList();
            educationalCard.Images.AddRange(image);
        }

        if (educationalCardDataRequest.Attachments != null && educationalCardDataRequest.Attachments.Any())
        {
            var attachment = educationalCardDataRequest.Attachments.Select(attachmentRequest => new CardAttachment
            {
                Url = attachmentRequest.Url,
                Description = attachmentRequest.Description,
                EducationalCardId = educationalCard.Id
            }).ToList();
            educationalCard.Attachments.AddRange(attachment);
        }
        
        await dbContext.SaveChangesAsync();

        return new EducationalDataResponse
        {
            Success = true,
            CardId = educationalCard.Id,
            Content = educationalCard.Content,
            Images = educationalCard.Images,
            Attachments = educationalCard.Attachments
        };
    }

    public EducationalDataResponse UpdateEducationalData(HttpContext context, EducationalCardDataRequest dataRequest)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var educationalCard = dbContext.EducationalCards
            .Include(ec => ec.Images)
            .Include(ec => ec.Attachments)
            .FirstOrDefault(ec => ec.Id == dataRequest.CardId);

        if (educationalCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }
        
        educationalCard.Content = dataRequest.Content;
        educationalCard.Images.Clear();
        educationalCard.Attachments.Clear();
        
        if (dataRequest.Images != null)
        {
            educationalCard.Images.AddRange(dataRequest.Images.Select(imageRequest => new CardImage
            {
                Url = imageRequest.Url,
                Caption = imageRequest.Caption,
                AltText = imageRequest.AltText,
                EducationalCardId = educationalCard.Id
            }));
        }
        
        if (dataRequest.Attachments != null)
        {
            educationalCard.Attachments.AddRange(dataRequest.Attachments.Select(attachmentRequest => new CardAttachment
            {
                Url = attachmentRequest.Url,
                Description = attachmentRequest.Description,
                EducationalCardId = educationalCard.Id
            }));
        }

        dbContext.SaveChanges();

        return new EducationalDataResponse
        {
            Success = true,
            CardId = educationalCard.Id,
            Content = educationalCard.Content,
            Images = educationalCard.Images,
            Attachments = educationalCard.Attachments
        };
    }
    
    public async Task<EducationalDataResponse> UpdateEducationalDataAsync(HttpContext context, EducationalCardDataRequest dataRequest)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var educationalCard = await dbContext.EducationalCards
            .Include(ec => ec.Images)
            .Include(ec => ec.Attachments)
            .FirstOrDefaultAsync(ec => ec.Id == dataRequest.CardId);

        if (educationalCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }
        
        educationalCard.Content = dataRequest.Content;
        educationalCard.Images.Clear();
        educationalCard.Attachments.Clear();
        
        if (dataRequest.Images != null)
        {
            educationalCard.Images.AddRange(dataRequest.Images.Select(imageRequest => new CardImage
            {
                Url = imageRequest.Url,
                Caption = imageRequest.Caption,
                AltText = imageRequest.AltText,
                EducationalCardId = educationalCard.Id
            }));
        }
        
        if (dataRequest.Attachments != null)
        {
            educationalCard.Attachments.AddRange(dataRequest.Attachments.Select(attachmentRequest => new CardAttachment
            {
                Url = attachmentRequest.Url,
                Description = attachmentRequest.Description,
                EducationalCardId = educationalCard.Id
            }));
        }

        await dbContext.SaveChangesAsync();

        return new EducationalDataResponse
        {
            Success = true,
            CardId = educationalCard.Id,
            Content = educationalCard.Content,
            Images = educationalCard.Images,
            Attachments = educationalCard.Attachments
        };
    }

    private EducationalDataResponse GetEducationalData(int id)
    {
        var educationalCard = dbContext.EducationalCards
            .Include(ec => ec.Images)
            .Include(ec => ec.Attachments)
            .FirstOrDefault(ec => ec.Id == id);

        if (educationalCard == null)
        {
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }

        return new EducationalDataResponse
        {
            Success = true,
            CardId = educationalCard.Id,
            Content = educationalCard.Content,
            Images = educationalCard.Images,
            Attachments = educationalCard.Attachments
        };
    }
    
    private async Task<EducationalDataResponse> GetEducationalDataAsync(int id)
    {
        var educationalCard = await dbContext.EducationalCards
            .Include(ec => ec.Images)
            .Include(ec => ec.Attachments)
            .FirstOrDefaultAsync(ec => ec.Id == id);

        if (educationalCard == null)
        {
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }

        return new EducationalDataResponse
        {
            Success = true,
            CardId = educationalCard.Id,
            Content = educationalCard.Content,
            Images = educationalCard.Images,
            Attachments = educationalCard.Attachments
        };
    }

    public TaskResponse AddTask(HttpContext context, TaskRequest taskRequest)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new TaskResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var sandboxCard = dbContext.SandboxCards.FirstOrDefault(sc => sc.Id == taskRequest.SandboxCardId);
        
        if (sandboxCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            
            return new TaskResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }
        
        var task = new Models.Entities.Task
        {
            Name = taskRequest.Name,
            Description = taskRequest.Description,
            Points = taskRequest.Points,
            SandboxCardId = taskRequest.SandboxCardId,
        };
        
        foreach (var item in taskRequest.ExpectedData)
        {
            var taskData = new TaskData
            {
                TaskId = task.Id,
                Value = item.Value,
            };

            if (taskData.IsSet)
            {
                task.ExpectedData.Add(taskData);
            }
        }
        
        dbContext.Tasks.Add(task);
        dbContext.SaveChanges();

        return new TaskResponse
        {
            Success = true,
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Points = task.Points
        };
    }
    
    public async Task<TaskResponse> AddTaskAsync(HttpContext context, TaskRequest taskRequest)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new TaskResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var sandboxCard = await dbContext.SandboxCards.FirstOrDefaultAsync(sc => sc.Id == taskRequest.SandboxCardId);
        
        if (sandboxCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            
            return new TaskResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }
        
        var task = new Models.Entities.Task
        {
            Name = taskRequest.Name,
            Description = taskRequest.Description,
            Points = taskRequest.Points,
            SandboxCardId = taskRequest.SandboxCardId,
        };
        
        foreach (var item in taskRequest.ExpectedData)
        {
            var taskData = new TaskData
            {
                TaskId = task.Id,
                Value = item.Value,
            };

            if (taskData.IsSet)
            {
                task.ExpectedData.Add(taskData);
            }
        }
        
        dbContext.Tasks.Add(task);
        await dbContext.SaveChangesAsync();

        return new TaskResponse
        {
            Success = true,
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Points = task.Points
        };
    }

    public TaskResponse UpdateTask(HttpContext context, TaskRequest taskRequest)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new TaskResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }

        if (!taskRequest.Id.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new TaskResponse
            {
                Success = false,
                Error = "Task Id not provided"
            };
        }
        
        var sandboxCard = dbContext.SandboxCards.FirstOrDefault(sc => sc.Id == taskRequest.SandboxCardId);
        
        if (sandboxCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            
            return new TaskResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }
        
        var task = dbContext.Tasks.FirstOrDefault(t => t.Id == taskRequest.Id);

        if (task == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return new TaskResponse
            {
                Success = false,
                Error = "Task not found"
            };
        }

        task.Name = taskRequest.Name;
        task.Description = taskRequest.Description;
        task.Points = taskRequest.Points;
        task.SandboxCardId = sandboxCard.Id;
        
        task.ExpectedData.Clear();
        
        if (taskRequest.ExpectedData != null)
        {
            foreach (var item in taskRequest.ExpectedData)
            {
                task.ExpectedData.Add(new TaskData
                {
                    TaskId = task.Id,
                    Value = item.Value,
                });
            }
        }
    
        dbContext.SaveChanges();

        return new TaskResponse
        {
            Success = true,
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Points = task.Points
        };
    }
    
    public async Task<TaskResponse> UpdateTaskAsync(HttpContext context, TaskRequest taskRequest)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new TaskResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }

        if (!taskRequest.Id.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new TaskResponse
            {
                Success = false,
                Error = "Task Id not provided"
            };
        }
        
        var sandboxCard = await dbContext.SandboxCards.FirstOrDefaultAsync(sc => sc.Id == taskRequest.SandboxCardId);
        
        if (sandboxCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            
            return new TaskResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }
        
        var task = await dbContext.Tasks.FirstOrDefaultAsync(t => t.Id == taskRequest.Id);

        if (task == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return new TaskResponse
            {
                Success = false,
                Error = "Task not found"
            };
        }

        task.Name = taskRequest.Name;
        task.Description = taskRequest.Description;
        task.Points = taskRequest.Points;
        task.SandboxCardId = sandboxCard.Id;
        
        task.ExpectedData.Clear();
        
        if (taskRequest.ExpectedData != null)
        {
            foreach (var item in taskRequest.ExpectedData)
            {
                task.ExpectedData.Add(new TaskData
                {
                    TaskId = task.Id,
                    Value = item.Value,
                });
            }
        }
    
        await dbContext.SaveChangesAsync();

        return new TaskResponse
        {
            Success = true,
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Points = task.Points
        };
    }
    
    public bool DeleteTask(HttpContext context, int id)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }
        
        if (dbContext.Tasks.Any(t => t.Id == id))
        {
            dbContext.Tasks.Where(t => t.Id == id).ExecuteDelete();
            dbContext.SaveChanges();
            return true;
        }
        
        return false;
    }
    
    public async Task<bool> DeleteTaskAsync(HttpContext context, int id)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }
        
        if (await dbContext.Tasks.AnyAsync(t => t.Id == id))
        {
            await dbContext.Tasks.Where(t => t.Id == id).ExecuteDeleteAsync();
            await dbContext.SaveChangesAsync();
            return true;
        }
        
        return false;
    }
}
