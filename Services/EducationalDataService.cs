using Crux.Data;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.EntityFrameworkCore;
using Crux.Models.Cards;

namespace Crux.Services;

public class EducationalDataService(ApplicationDbContext dbContext,
    IS3StorageService s3StorageService) : IEducationalDataService
{
    public async Task<EducationalDataResponse> AddEducationalDataAsync(EducationalCardDataRequest educationalCardDataRequest)
    {
        var educationalCard = await dbContext.EducationalCards.
            Include(ec => ec.Images).
            Include(ec => ec.Attachments).
            FirstOrDefaultAsync(ec => ec.Id == educationalCardDataRequest.CardId);

        if (educationalCard == null)
        {
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Invalid Card Id"
            };
        }
        
        educationalCard.Content = educationalCardDataRequest.Content;
        
        var oldImageUrls = educationalCard.Images.Select(i => i.Url).ToList();
        var oldAttachmentUrls = educationalCard.Attachments.Select(a => a.Url).ToList();
        
        educationalCard.Images.Clear();
        educationalCard.Attachments.Clear();

        try
        {
            if (educationalCardDataRequest.Images?.Count > 0)
            {
                var cardImages = new List<CardImage>();
                var s3FolderPath = $"uploads/images/educational-cards/{educationalCard.Id}";
                
                foreach (var image in educationalCardDataRequest.Images)
                {
                    if (string.IsNullOrWhiteSpace(image.Data))
                    {
                        return new EducationalDataResponse
                        {
                            Success = false,
                            Error = "Image data is required"
                        };
                    }
                    
                    if (string.IsNullOrWhiteSpace(image.ContentType))
                    {
                        return new EducationalDataResponse
                        {
                            Success = false,
                            Error = "Image content type is required"
                        };
                    }

                    byte[] imageBytes;
                    try
                    {
                        imageBytes = Convert.FromBase64String(image.Data);
                    }
                    catch (FormatException)
                    {
                        return new EducationalDataResponse
                        {
                            Success = false,
                            Error = "Invalid Base64 image data"
                        };
                    }
                    
                    if (imageBytes.Length > 10 * 1024 * 1024)
                    {
                        return new EducationalDataResponse
                        {
                            Success = false,
                            Error = "Image size exceeds 10MB limit"
                        };
                    }
                    
                    var extension = image.ContentType.ToLowerInvariant() switch
                    {
                        "image/jpeg" => ".jpg",
                        "image/jpg" => ".jpg",
                        "image/png" => ".png",
                        "image/gif" => ".gif",
                        "image/webp" => ".webp",
                        "image/bmp" => ".bmp",
                        _ => ".img"
                    };
                    
                    var fileName = !string.IsNullOrWhiteSpace(image.FileName) 
                        ? $"{Path.GetFileNameWithoutExtension(image.FileName)}_{Guid.NewGuid()}{extension}"
                        : $"{Guid.NewGuid()}{extension}";

                    var s3Url = await s3StorageService.UploadFileAsync(imageBytes, s3FolderPath, fileName);
                
                    cardImages.Add(new CardImage
                    {
                        Url = s3Url,
                        Caption = image.Caption,
                        AltText = image.AltText,
                        EducationalCardId = educationalCard.Id
                    });
                }
            
                educationalCard.Images.AddRange(cardImages);
            }
        
            if (educationalCardDataRequest.Attachments?.Count > 0)
            {
                var cardAttachments = new List<CardAttachment>();
                var s3FolderPath = $"uploads/attachments/educational-cards/{educationalCard.Id}";
            
                foreach (var attachment in educationalCardDataRequest.Attachments)
                {
                    if (string.IsNullOrWhiteSpace(attachment.Data))
                    {
                        return new EducationalDataResponse
                        {
                            Success = false,
                            Error = "Attachment data is required"
                        };
                    }
                    
                    if (string.IsNullOrWhiteSpace(attachment.ContentType))
                    {
                        return new EducationalDataResponse
                        {
                            Success = false,
                            Error = "Attachment content type is required"
                        };
                    }

                    byte[] attachmentBytes;
                    try
                    {
                        attachmentBytes = Convert.FromBase64String(attachment.Data);
                    }
                    catch (FormatException)
                    {
                        return new EducationalDataResponse
                        {
                            Success = false,
                            Error = "Invalid Base64 attachment data"
                        };
                    }
                    
                    if (attachmentBytes.Length > 50 * 1024 * 1024)
                    {
                        return new EducationalDataResponse
                        {
                            Success = false,
                            Error = "Attachment size exceeds 50MB limit"
                        };
                    }
                    
                    var extension = GetFileExtensionFromContentType(attachment.ContentType);
                    if (string.IsNullOrEmpty(extension) && !string.IsNullOrWhiteSpace(attachment.FileName))
                    {
                        extension = Path.GetExtension(attachment.FileName);
                    }
                    if (string.IsNullOrEmpty(extension))
                    {
                        extension = ".dat";
                    }
                    
                    var fileName = !string.IsNullOrWhiteSpace(attachment.FileName) 
                        ? $"{Path.GetFileNameWithoutExtension(attachment.FileName)}_{Guid.NewGuid()}{extension}"
                        : $"{Guid.NewGuid()}{extension}";

                    var s3Url = await s3StorageService.UploadFileAsync(attachmentBytes, s3FolderPath, fileName);
                
                    cardAttachments.Add(new CardAttachment
                    {
                        Url = s3Url,
                        Description = attachment.Description,
                        EducationalCardId = educationalCard.Id
                    });
                }
            
                educationalCard.Attachments.AddRange(cardAttachments);
            }
            
            foreach (var url in oldImageUrls)
            {
                await s3StorageService.DeleteFileAsync(url);
            }
        
            foreach (var url in oldAttachmentUrls)
            {
                await s3StorageService.DeleteFileAsync(url);
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
        catch (Exception ex)
        {
            Console.WriteLine($"Error processing educational card data: {ex.Message}");
            return new EducationalDataResponse
            {
                Success = false,
                Error = "Failed to process educational card data"
            };
        }
    }
    
    
    public async Task<bool> DeleteEducationalCardFilesAsync(int cardId)
    {
        var imagesFolder = $"uploads/images/educational-cards/{cardId}";
        var attachmentsFolder = $"uploads/attachments/educational-cards/{cardId}";
    
        try
        {
            await s3StorageService.DeleteFolderAsync(imagesFolder);
            await s3StorageService.DeleteFolderAsync(attachmentsFolder);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting S3 files for educational card {cardId}: {ex.Message}");
            return false;
        }
    }
    
    public async Task<EducationalDataResponse> UpdateEducationalDataAsync(EducationalCardDataRequest dataRequest)
    {
        return await AddEducationalDataAsync(dataRequest);
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
    
    private static string GetFileExtensionFromContentType(string contentType)
    {
        return contentType.ToLowerInvariant() switch
        {
            "application/pdf" => ".pdf",
            "application/msword" => ".doc",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => ".docx",
            "application/vnd.ms-excel" => ".xls",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" => ".xlsx",
            "application/vnd.ms-powerpoint" => ".ppt",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation" => ".pptx",
            "text/plain" => ".txt",
            "text/csv" => ".csv",
            "application/json" => ".json",
            "application/xml" => ".xml",
            "application/zip" => ".zip",
            "application/x-rar-compressed" => ".rar",
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/gif" => ".gif",
            "image/webp" => ".webp",
            "video/mp4" => ".mp4",
            "video/avi" => ".avi",
            "audio/mp3" => ".mp3",
            "audio/wav" => ".wav",
            _ => ""
        };
    }
}
