using Crux.Data;
using Crux.Models.Entities;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.EntityFrameworkCore;
using Crux.Models.EntityTypes;

namespace Crux.Services;

public class QuestionService(
    IAuthenticationService authenticationService,
    ApplicationDbContext dbContext) : IQuestionService
{
    public ICollection<QuestionResponse> GetQuestions(int userId, int cardId)
    {
        var card = dbContext.TestCards
            .Include(tc => tc.Questions)
            .ThenInclude(q => q.Answers)
            .FirstOrDefault(tc => tc.Id == cardId);

        var questionsInfo = new List<QuestionResponse>();

        if (card == null)
        {
            return [];
        }

        foreach (var question in card.Questions)
        {
            questionsInfo.Add(GetQuestionInfo(userId, question, question.Answers.ToList()));
        }

        return questionsInfo;
    }

    public async Task<ICollection<QuestionResponse>> GetQuestionsAsync(int userId, int cardId)
    {
        var card = await dbContext.TestCards
            .Include(tc => tc.Questions)
            .ThenInclude(q => q.Answers)
            .FirstOrDefaultAsync(tc => tc.Id == cardId);

        var questionsInfo = new List<QuestionResponse>();

        if (card == null) return [];

        foreach (var question in card.Questions)
        {
            var questionInfo = await GetQuestionInfoAsync(userId, question, question.Answers.ToList());
            questionsInfo.Add(questionInfo);
        }

        return questionsInfo;
    }

    private QuestionResponse GetQuestionInfo(int? userId, Question question, List<Answer> answers)
    {
        var isCompleted = dbContext.UserQuestionProgresses.Any(progress => progress.UserId == userId
                                                                           && progress.QuestionId == question.Id);

        return new QuestionResponse
        {
            Success = true,
            Id = question.Id,
            QuestionText = question.QuestionText,
            Answers = answers.Select(a => new AnswerResponse
            {
                Id = a.Id,
                AnswerText = a.AnswerText,
                Score = a.Score,
                Success = true
            }).ToList(),
            IsCompleted = isCompleted
        };
    }

    private async Task<QuestionResponse> GetQuestionInfoAsync(int? userId, Question question, List<Answer> answers)
    {
        var isCompleted = await dbContext.UserQuestionProgresses.AnyAsync(progress => progress.UserId == userId
            && progress.QuestionId == question.Id);

        return new QuestionResponse
        {
            Success = true,
            Id = question.Id,
            QuestionText = question.QuestionText,
            Answers = answers.Select(a => new AnswerResponse
            {
                Id = a.Id,
                AnswerText = a.AnswerText,
                Score = a.Score,
                Success = true
            }).ToList(),
            IsCompleted = isCompleted
        };
    }

    public QuestionResponse AddQuestion(HttpContext context, QuestionRequest questionRequest)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return new QuestionResponse { Success = false, Error = "Unauthorized access" };
        }

        var testCard = dbContext.TestCards.FirstOrDefault(tc => tc.Id == questionRequest.TestCardId);
        if (testCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new QuestionResponse { Success = false, Error = "Invalid Card Id" };
        }

        var question = new Question
        {
            TestCardId = questionRequest.TestCardId,
            QuestionText = questionRequest.QuestionText
        };
        dbContext.Questions.Add(question);
        dbContext.SaveChanges();

        var newAnswers = questionRequest.Answers.Select(a => new Answer
        {
            QuestionId = question.Id,
            AnswerText = a.AnswerText,
            Score = a.Score,
            IsCorrect = a.IsCorrect
        }).ToList();

        if (newAnswers.Count != 0)
        {
            dbContext.Answers.AddRange(newAnswers);
            dbContext.SaveChanges();
        }

        return new QuestionResponse
        {
            Success = true,
            Id = question.Id,
            QuestionText = question.QuestionText,
            Answers = newAnswers.Select(a => new AnswerResponse
            {
                Id = a.Id,
                AnswerText = a.AnswerText,
                Score = a.Score,
                Success = true
            }).ToList()
        };
    }

    public async Task<QuestionResponse> AddQuestionAsync(HttpContext context, QuestionRequest questionRequest)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return new QuestionResponse { Success = false, Error = "Unauthorized access" };
        }

        var testCard = await dbContext.TestCards.FirstOrDefaultAsync(tc => tc.Id == questionRequest.TestCardId);
        if (testCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new QuestionResponse { Success = false, Error = "Invalid Card Id" };
        }

        var question = new Question
        {
            TestCardId = questionRequest.TestCardId,
            QuestionText = questionRequest.QuestionText
        };
        dbContext.Questions.Add(question);
        await dbContext.SaveChangesAsync();

        var newAnswers = questionRequest.Answers.Select(a => new Answer
        {
            QuestionId = question.Id,
            AnswerText = a.AnswerText,
            Score = a.Score,
            IsCorrect = a.IsCorrect
        }).ToList();

        if (newAnswers.Count != 0)
        {
            await dbContext.Answers.AddRangeAsync(newAnswers);
            await dbContext.SaveChangesAsync();
        }

        return new QuestionResponse
        {
            Success = true,
            Id = question.Id,
            QuestionText = question.QuestionText,
            Answers = newAnswers.Select(a => new AnswerResponse
            {
                Id = a.Id,
                AnswerText = a.AnswerText,
                Score = a.Score,
                Success = true
            }).ToList()
        };
    }

    public QuestionResponse UpdateQuestion(HttpContext context, QuestionRequest questionRequest)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return new QuestionResponse { Success = false, Error = "Unauthorized access" };
        }

        if (!questionRequest.Id.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new QuestionResponse { Success = false, Error = "Question Id not provided" };
        }

        var testCard = dbContext.TestCards.FirstOrDefault(tc => tc.Id == questionRequest.TestCardId);
        if (testCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new QuestionResponse { Success = false, Error = "Invalid Card Id" };
        }

        var question = dbContext.Questions.Include(q => q.Answers)
            .FirstOrDefault(q => q.Id == questionRequest.Id.Value);
        if (question == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return new QuestionResponse { Success = false, Error = "Question not found" };
        }

        question.TestCardId = questionRequest.TestCardId;
        question.QuestionText = questionRequest.QuestionText;

        dbContext.Answers.RemoveRange(question.Answers);
        question.Answers.Clear();
        dbContext.SaveChanges();


        var newAnswersList = new List<AnswerResponse>();
        if (questionRequest.Answers.Count != 0)
        {
            var newAnswers = questionRequest.Answers.Select(a => new Answer
            {
                QuestionId = question.Id,
                AnswerText = a.AnswerText,
                Score = a.Score,
                IsCorrect = a.IsCorrect
            }).ToList();
            dbContext.Answers.AddRange(newAnswers);
            dbContext.SaveChanges();

            newAnswersList = newAnswers.Select(a => new AnswerResponse
            {
                Id = a.Id,
                AnswerText = a.AnswerText,
                Score = a.Score,
                Success = true
            }).ToList();
        }

        return new QuestionResponse
        {
            Success = true,
            Id = question.Id,
            QuestionText = question.QuestionText,
            Answers = newAnswersList
        };
    }

    public async Task<QuestionResponse> UpdateQuestionAsync(HttpContext context, QuestionRequest questionRequest)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return new QuestionResponse { Success = false, Error = "Unauthorized access" };
        }

        if (!questionRequest.Id.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new QuestionResponse { Success = false, Error = "Question Id not provided" };
        }

        var testCard = await dbContext.TestCards.FirstOrDefaultAsync(tc => tc.Id == questionRequest.TestCardId);
        if (testCard == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return new QuestionResponse { Success = false, Error = "Invalid Card Id" };
        }

        var question = await dbContext.Questions.Include(q => q.Answers)
            .FirstOrDefaultAsync(q => q.Id == questionRequest.Id.Value);
        if (question == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return new QuestionResponse { Success = false, Error = "Question not found" };
        }

        question.TestCardId = questionRequest.TestCardId;
        question.QuestionText = questionRequest.QuestionText;

        dbContext.Answers.RemoveRange(question.Answers);
        question.Answers.Clear();
        await dbContext.SaveChangesAsync();


        var newAnswersList = new List<AnswerResponse>();
        if (questionRequest.Answers.Count != 0)
        {
            var newAnswers = questionRequest.Answers.Select(a => new Answer
            {
                QuestionId = question.Id,
                AnswerText = a.AnswerText,
                Score = a.Score,
                IsCorrect = a.IsCorrect
            }).ToList();
            await dbContext.Answers.AddRangeAsync(newAnswers);
            await dbContext.SaveChangesAsync();

            newAnswersList = newAnswers
                .Select(a => new AnswerResponse
                {
                    Id = a.Id,
                    AnswerText = a.AnswerText,
                    Score = a.Score,
                    Success = true
                }).ToList();
        }

        return new QuestionResponse
        {
            Success = true,
            Id = question.Id,
            QuestionText = question.QuestionText,
            Answers = newAnswersList
        };
    }

    public bool DeleteQuestion(HttpContext context, int id)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }

        var question = dbContext.Questions.Include(q => q.Answers)
            .FirstOrDefault(q => q.Id == id);
        if (question != null)
        {
            dbContext.Questions.Remove(question);
            dbContext.SaveChanges();
            return true;
        }

        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return false;
    }

    public async Task<bool> DeleteQuestionAsync(HttpContext context, int id)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }

        var question = await dbContext.Questions.Include(q => q.Answers)
            .FirstOrDefaultAsync(q => q.Id == id);
        if (question != null)
        {
            dbContext.Questions.Remove(question);
            await dbContext.SaveChangesAsync();
            return true;
        }

        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return false;
    }
}
