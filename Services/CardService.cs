using Crux.Data;
using Crux.Extensions;
using Crux.Models.Cards;
using Crux.Models.Entities;
using Crux.Models.EntityTypes;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace Crux.Services;

public class CardService(
    ApplicationDbContext dbContext,
    IEducationalDataService educationalDataService,
    IQuestionService questionService,
    ITaskService taskService) : ICardManagementService
{
    public ICollection<BriefCardResponse> GetLessonCards(int lessonId)
    {
        var lesson = dbContext.Lessons
            .Include(l => l.Cards)
            .FirstOrDefault(l => l.Id == lessonId);

        if (lesson == null)
        {
            return [];
        }
        
        var cardsInfo = new List<BriefCardResponse>();
        
        lesson.Cards
            .ToList()
            .ForEach(card => cardsInfo.Add(GetCardBrief(card.Id)));
        
        return cardsInfo;
    }
    
    public async Task<ICollection<BriefCardResponse>> GetLessonCardsAsync(int lessonId)
    {
        var lesson = await dbContext.Lessons
            .Include(l => l.Cards)
            .FirstOrDefaultAsync(l => l.Id == lessonId);

        if (lesson == null)
        {
            return [];
        }
        
        var cardsInfo = new List<BriefCardResponse>();

        foreach (var card in lesson.Cards)
        {
            cardsInfo.Add(await GetCardBriefAsync(card.Id));
        }
        
        return cardsInfo;
    }

    public BriefCardResponse GetCardBrief(int id)
    {
        var card = dbContext.Cards.FirstOrDefault(card => card.Id == id);

        if (card == null)
        {
            return new BriefCardResponse
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
    
    public async Task<BriefCardResponse> GetCardBriefAsync(int id)
    {
        var card = await dbContext.Cards.FirstOrDefaultAsync(card => card.Id == id);

        if (card == null)
        {
            return new BriefCardResponse
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
    
    public FullCardResponse GetCardFull(int userId, int cardId)
    {
        var card = dbContext.Cards.FirstOrDefault(card => card.Id == cardId);

        if (card == null)
        {
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
            CardType = card.CardType.ToString(),
            Description = card.Description,
            EducationalData = card is EducationalCard educationalCard ? educationalDataService.GetEducationalData(educationalCard.Id) : null,
            Questions = card is TestCard ? questionService.GetQuestions(userId, card.Id) : null,
            Tasks = card is SandboxCard ? taskService.GetTasks(userId, card.Id) : null,
            SandboxType = card is SandboxCard sandboxCard ? sandboxCard.Type.ToString() : null
        };
    }
    
    public async Task<FullCardResponse> GetCardFullAsync(int userId, int cardId)
    {
        var card = await dbContext.Cards.FirstOrDefaultAsync(card => card.Id == cardId);

        if (card == null)
        {
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
            CardType = card.CardType.ToString(),
            Description = card.Description,
            EducationalData = card is EducationalCard educationalCard ? await educationalDataService.GetEducationalDataAsync(educationalCard.Id) : null,
            Questions = card is TestCard ? await questionService.GetQuestionsAsync(userId, card.Id) : null,
            Tasks = card is SandboxCard ? await taskService.GetTasksAsync(userId, card.Id) : null,
            SandboxType = card is SandboxCard sandboxCard ? sandboxCard.Type.ToString() : null
        };
    }

    public FullCardResponse AddCard(int userId, CardRequest cardRequest)
    {
        var lesson = dbContext.Lessons.FirstOrDefault(l => l.Id == cardRequest.LessonId);
        if (lesson == null)
        {
            return new FullCardResponse
            {
                Success = false,
                Error = "Invalid lesson id"
            };
        }
        
        Card newCard;
        switch (cardRequest.CardType.ToCardType())
        {
            case CardType.Educational:
                newCard = new EducationalCard
                {
                    Title = cardRequest.Title,
                    CardType = cardRequest.CardType.ToCardType(),
                    Description = cardRequest.Description,
                    LessonId = cardRequest.LessonId
                };
                dbContext.EducationalCards.Add((EducationalCard)newCard);
                break;
            case CardType.Test:
                newCard = new TestCard
                {
                    Title = cardRequest.Title,
                    CardType = cardRequest.CardType.ToCardType(),
                    Description = cardRequest.Description,
                    LessonId = cardRequest.LessonId
                };
                dbContext.TestCards.Add((TestCard)newCard);
                break;
            case CardType.Sandbox:
                newCard = new SandboxCard
                {
                    Title = cardRequest.Title,
                    CardType = cardRequest.CardType.ToCardType(),
                    Description = cardRequest.Description,
                    LessonId = cardRequest.LessonId,
                    Type = cardRequest.SandBoxCardType.ToSandboxCardType()
                };
                dbContext.SandboxCards.Add((SandboxCard)newCard);
                break;
            default:
                return new FullCardResponse
                {
                    Success = false,
                    Error = "Invalid card type"
                };
        }
        
        dbContext.SaveChanges();
        
        return GetCardFull(userId, newCard.Id);
    }
    
    public async Task<FullCardResponse> AddCardAsync(int userId, CardRequest cardRequest)
    {
        var lesson = await dbContext.Lessons.FirstOrDefaultAsync(l => l.Id == cardRequest.LessonId);
        if (lesson == null)
        {
            return new FullCardResponse
            {
                Success = false,
                Error = "Invalid lesson id"
            };
        }
        
        Card newCard;
        switch (cardRequest.CardType.ToCardType())
        {
            case CardType.Educational:
                newCard = new EducationalCard
                {
                    Title = cardRequest.Title,
                    CardType = cardRequest.CardType.ToCardType(),
                    Description = cardRequest.Description,
                    LessonId = cardRequest.LessonId
                };
                dbContext.EducationalCards.Add((EducationalCard)newCard);
                break;
            case CardType.Test:
                newCard = new TestCard
                {
                    Title = cardRequest.Title,
                    CardType = cardRequest.CardType.ToCardType(),
                    Description = cardRequest.Description,
                    LessonId = cardRequest.LessonId
                };
                dbContext.TestCards.Add((TestCard)newCard);
                break;
            case CardType.Sandbox:
                newCard = new SandboxCard
                {
                    Title = cardRequest.Title,
                    CardType = cardRequest.CardType.ToCardType(),
                    Description = cardRequest.Description,
                    LessonId = cardRequest.LessonId,
                    Type = cardRequest.SandBoxCardType.ToSandboxCardType()
                };
                dbContext.SandboxCards.Add((SandboxCard)newCard);
                break;
            default:
                return new FullCardResponse
                {
                    Success = false,
                    Error = "Invalid card type"
                };
        }
        
        await dbContext.SaveChangesAsync();
        
        return await GetCardFullAsync(userId, newCard.Id);
    }

    public FullCardResponse UpdateCard(int userId, CardRequest cardRequest)
    {
        if (cardRequest.Id == null)
        {
            return new FullCardResponse
            {
                Success = false,
                Error = "Card id is not provided"
            };
        }
        
        var card = dbContext.Cards.FirstOrDefault(c => c.Id == cardRequest.Id);
        if (card == null)
        {
            return new FullCardResponse
            {
                Success = false,
                Error = "Invalid card id"
            };
        }
        
        var lesson = dbContext.Lessons.FirstOrDefault(l => l.Id == cardRequest.LessonId);
        if (lesson == null)
        {
            return new FullCardResponse
            {
                Success = false,
                Error = "Invalid lesson id"
            };
        }
        
        if (card.CardType != cardRequest.CardType.ToCardType())
        {
            return new FullCardResponse
            {
                Success = false,
                Error = "Changing card type is not supported."
            };
        }

        card.Title = cardRequest.Title;
        card.Description = cardRequest.Description;
        card.LessonId = cardRequest.LessonId;

        if (card is SandboxCard sandboxCard && cardRequest.SandBoxCardType != null)
        {
            sandboxCard.Type = cardRequest.SandBoxCardType.ToSandboxCardType();
        }
        
        dbContext.SaveChanges();
        
        return GetCardFull(userId, card.Id);
    }
    
    public async Task<FullCardResponse> UpdateCardAsync(int userId, CardRequest cardRequest)
    {
        if (cardRequest.Id == null)
        {
            return new FullCardResponse
            {
                Success = false,
                Error = "Card id is not provided"
            };
        }
        
        var card = await dbContext.Cards.FirstOrDefaultAsync(c => c.Id == cardRequest.Id);

        if (card == null)
        {
            return new FullCardResponse
            {
                Success = false,
                Error = "Invalid card id"
            };
        }
        
        var lesson = await dbContext.Lessons.FirstOrDefaultAsync(l => l.Id == cardRequest.LessonId);
        if (lesson == null)
        {
            return new FullCardResponse
            {
                Success = false,
                Error = "Invalid lesson id"
            };
        }

        if (card.CardType != cardRequest.CardType.ToCardType())
        {
            return new FullCardResponse
            {
                Success = false,
                Error = "Changing card type is not supported."
            };
        }
        
        card.Title = cardRequest.Title;
        card.Description = cardRequest.Description;
        card.LessonId = cardRequest.LessonId;

        if (card is SandboxCard sandboxCard && cardRequest.SandBoxCardType != null)
        {
            sandboxCard.Type = cardRequest.SandBoxCardType.ToSandboxCardType();
        }
        
        await dbContext.SaveChangesAsync();
        
        return await GetCardFullAsync(userId, card.Id);
    }

    public bool DeleteCard(int id)
    {
        var card = dbContext.Cards.FirstOrDefault(c => c.Id == id);
        if (card != null)
        {
            dbContext.Cards.Remove(card);
            dbContext.SaveChanges();
            
            return true;
        }
        
        return false;
    }
    
    public async Task<bool> DeleteCardAsync(int id)
    {
        var card = await dbContext.Cards.FirstOrDefaultAsync(c => c.Id == id);
        if (card != null)
        {
            if (card.CardType == CardType.Educational)
            {
                educationalDataService.DeleteEducationalCardFiles(id);
            }
            
            dbContext.Cards.Remove(card);
            await dbContext.SaveChangesAsync();
            return true;
        }
        
        return false;
    }
}
