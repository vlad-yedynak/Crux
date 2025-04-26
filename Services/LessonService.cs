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

    public ICollection<KeyValuePair<int, LessonResponse>> GetLessons(HttpContext context)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return [];
        }
        
        var lessons = new List<KeyValuePair<int, LessonResponse>>();
        
        dbContext.Lessons.ToList()
            .ForEach(lesson =>
            {
                lessons.Add(new KeyValuePair<int, LessonResponse>(lesson.Id, new LessonResponse
                {
                    Id = lesson.Id,
                    Title = lesson.Title,
                    Cards = GetLessonCards(lesson.Id)
                }));
            } );
        
        return lessons;
    }

    public CardResponse AddCard(HttpContext context, CardRequest cardRequest)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return new CardResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var lesson = dbContext.Lessons.FirstOrDefault(l => l.Id == cardRequest.LessonId);
        if (lesson == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new CardResponse
            {
                Success = false,
                Error = "Invalid lesson id"
            };
        }
        
        switch (cardRequest.CardType)
        {
            case CardType.Educational:
                if (cardRequest.Content == null)
                {
                    return new CardResponse
                    {
                        Success = false,
                        Error = "Educational card must include content"
                    };
                }

                dbContext.EducationalCards.Add(new EducationalCard
                {
                    Title = cardRequest.Title,
                    Description = cardRequest.Description,
                    LessonId = cardRequest.LessonId,
                    Content = cardRequest.Content
                });
                break;
            case CardType.Test:
                dbContext.TestCards.Add(new TestCard
                {
                    Title = cardRequest.Title,
                    Description = cardRequest.Description,
                    LessonId = cardRequest.LessonId
                });
                break;
            default:
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                
                return new CardResponse
                {
                    Success = false,
                    Error = "Invalid card type"
                };
        }
        
        dbContext.SaveChanges();
        
        return new CardResponse
        {
            Success = true
        };
    }

    private CardResponse GetCardInfo(int id)
    {
        var card = dbContext.Cards.FirstOrDefault(card => card.Id == id);

        if (card == null)
        {
            return new CardResponse
            {
                Success = false,
                Error = "Card not found"
            };
        }
        
        var content = card switch
        {
            EducationalCard educationalCard => educationalCard.Content,
            _ => null
        };

        return new CardResponse
        {
            Success = true,
            Id = card.Id,
            LessonId = card.LessonId,
            Title = card.Title,
            CardType = card.CardType,
            Description = card.Description,
            Content = content,
            Questions = GetQuestions(card.Id)
        };
    }

    private List<KeyValuePair<int, CardResponse>> GetLessonCards(int lessonId)
    {
        var lesson = dbContext.Lessons.Include(lesson => lesson.Cards)
            .FirstOrDefault(lesson => lesson.Id == lessonId);
        var cardsInfo = new List<KeyValuePair<int, CardResponse>>();

        if (lesson == null)
        {
            return [];
        }
        
        lesson.Cards.ToList().ForEach(card =>
        {
            cardsInfo.Add(new KeyValuePair<int, CardResponse>(card.Id, GetCardInfo(card.Id)));
        });
        
        return cardsInfo;
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
            AnswerText = answer.AnswerText,
        };
    }

    public QuestionResponse AddQuestion(HttpContext context, QuestionRequest questionRequest)
    {
        // TODO: 
        throw new NotImplementedException();
    }
}