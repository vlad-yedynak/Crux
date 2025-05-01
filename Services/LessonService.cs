using Crux.Data;
using Crux.Models;
using Crux.Models.Cards;
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
        if (!authenticationService.CheckAuthentication(context))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return [];
        }
        
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
    
    public BriefCardResponse GetCardBrief(HttpContext context, int id)
    {
        if (!authenticationService.CheckAuthentication(context))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new BriefCardResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
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
            CardType = card.CardType,
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

        return new FullCardResponse
        {
            Success = true,
            Id = card.Id,
            LessonId = card.LessonId,
            Title = card.Title,
            CardType = card.CardType,
            Description = card.Description,
            Content = card is EducationalCard educationalCard ? educationalCard.Content : null,
            Questions = card is TestCard ? GetQuestions(card.Id) : null,
            Tasks = card is SandboxCard ? GetTasks(card.Id) : null
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
        
        switch (cardRequest.CardType)
        {
            case CardType.Educational:
                dbContext.EducationalCards.Add(new EducationalCard
                {
                    Title = cardRequest.Title,
                    CardType = cardRequest.CardType,
                    Description = cardRequest.Description,
                    LessonId = cardRequest.LessonId
                });
                
                break;
            case CardType.Test:
                dbContext.TestCards.Add(new TestCard
                {
                    Title = cardRequest.Title,
                    CardType = cardRequest.CardType,
                    Description = cardRequest.Description,
                    LessonId = cardRequest.LessonId
                });
                
                break;
            case CardType.Sandbox:
                dbContext.SandboxCards.Add(new SandboxCard
                {
                    Title = cardRequest.Title,
                    CardType = cardRequest.CardType,
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

    private List<QuestionResponse> GetQuestions(int cardId)
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
            questionsInfo.Add(GetQuestionInfo(question.Id));
        });
        
        return questionsInfo;
    }
    
    private List<TaskResponse> GetTasks(int cardId)
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
            tasksInfo.Add(GetTaskInfo(task.Id));
        });
        
        return tasksInfo;
    }

    private QuestionResponse GetQuestionInfo(int id)
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

        return new QuestionResponse
        {
            Success = true,
            Id = question.Id,
            QuestionText = question.QuestionText,
            Answers = GetAnswers(question.Id)
        };
    }
    
    private TaskResponse GetTaskInfo(int id)
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

        return new TaskResponse
        {
            Success = true,
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Points = task.Points
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
    
    public ContentResponse AddContent(HttpContext context, ContentRequest contentRequest)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            
            return new ContentResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var educationalCard = dbContext.EducationalCards.FirstOrDefault(ec => ec.Id == contentRequest.CardId);

        if (educationalCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            
            return new ContentResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }
        
        educationalCard.Content = contentRequest.Content;
        dbContext.SaveChanges();

        return new ContentResponse
        {
            Success = true,
            CardId = educationalCard.Id
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
        
        var task = new Models.Task
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
}
