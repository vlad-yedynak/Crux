using Crux.Data;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.EntityFrameworkCore;
using Crux.Models.Cards;
using Crux.Models.EntityTypes;

namespace Crux.Services;

public class EducationalDataService(
    IAuthenticationService authenticationService,
    ApplicationDbContext dbContext) : IEducationalDataService
{
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
            var images = educationalCardDataRequest.Images.Select(imageRequest => new CardImage
            {
                Url = imageRequest.Url,
                Caption = imageRequest.Caption,
                AltText = imageRequest.AltText,
                EducationalCardId = educationalCard.Id
            }).ToList();
            
            images.ForEach(img => educationalCard.Images.Add(img));
        }

        if (educationalCardDataRequest.Attachments != null && educationalCardDataRequest.Attachments.Any())
        {
            var attachments = educationalCardDataRequest.Attachments.Select(attachmentRequest => new CardAttachment
            {
                Url = attachmentRequest.Url,
                Description = attachmentRequest.Description,
                EducationalCardId = educationalCard.Id
            }).ToList();
            
            attachments.ForEach(att => educationalCard.Attachments.Add(att));
        }
        
        dbContext.SaveChanges();

        return new EducationalDataResponse
        {
            Success = true,
            CardId = educationalCard.Id,
            Content = educationalCard.Content,
            Images = educationalCard.Images.ToList(),
            Attachments = educationalCard.Attachments.ToList()
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
            var images = educationalCardDataRequest.Images.Select(imageRequest => new CardImage
            {
                Url = imageRequest.Url,
                Caption = imageRequest.Caption,
                AltText = imageRequest.AltText,
                EducationalCardId = educationalCard.Id
            }).ToList();
            
            images.ForEach(img => educationalCard.Images.Add(img));
        }

        if (educationalCardDataRequest.Attachments != null && educationalCardDataRequest.Attachments.Any())
        {
            var attachments = educationalCardDataRequest.Attachments.Select(attachmentRequest => new CardAttachment
            {
                Url = attachmentRequest.Url,
                Description = attachmentRequest.Description,
                EducationalCardId = educationalCard.Id
            }).ToList();
            attachments.ForEach(att => educationalCard.Attachments.Add(att));
        }
        
        await dbContext.SaveChangesAsync();

        return new EducationalDataResponse
        {
            Success = true,
            CardId = educationalCard.Id,
            Content = educationalCard.Content,
            Images = educationalCard.Images.ToList(),
            Attachments = educationalCard.Attachments.ToList()
        };
    }

    public EducationalDataResponse UpdateEducationalData(HttpContext context, EducationalCardDataRequest dataRequest)
    {
        return AddEducationalData(context, dataRequest); 
    }
    
    public async Task<EducationalDataResponse> UpdateEducationalDataAsync(HttpContext context, EducationalCardDataRequest dataRequest)
    {
        return await AddEducationalDataAsync(context, dataRequest);
    }

    public EducationalDataResponse GetEducationalData(int cardId)
    {
        var educationalCard = dbContext.EducationalCards
            .Include(ec => ec.Images)
            .Include(ec => ec.Attachments)
            .FirstOrDefault(ec => ec.Id == cardId);

        if (educationalCard == null)
        {
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Educational card data not found for the given card ID."
            };
        }

        return new EducationalDataResponse
        {
            Success = true,
            CardId = educationalCard.Id,
            Content = educationalCard.Content,
            Images = educationalCard.Images.ToList(),
            Attachments = educationalCard.Attachments.ToList()
        };
    }
    
    public async Task<EducationalDataResponse> GetEducationalDataAsync(int cardId)
    {
        var educationalCard = await dbContext.EducationalCards
            .Include(ec => ec.Images)
            .Include(ec => ec.Attachments)
            .FirstOrDefaultAsync(ec => ec.Id == cardId);

        if (educationalCard == null)
        {
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Educational card data not found for the given card ID."
            };
        }

        return new EducationalDataResponse
        {
            Success = true,
            CardId = educationalCard.Id,
            Content = educationalCard.Content,
            Images = educationalCard.Images.ToList(),
            Attachments = educationalCard.Attachments.ToList()
        };
    }
}
