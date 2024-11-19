import { Body, Controller, Get, NotImplementedException, Param, Post } from "@nestjs/common";
import { CreateLobbyDto, JoinLobbyDto, LobbyDto, UpdateLobbyDto, UpdatePlayerInLobbyDto } from "./lobby.dto";
import { LobbyService } from "./lobby.service";
import { LobbyModel } from "./lobby.model";

@Controller("lobby")
export class LobbyController {
    constructor(private readonly lobbyService: LobbyService) {}

    @Get("/lobby")
    public findAllLobbies(): string[] {
        return this.lobbyService.findIds();
    }

    @Get("/lobby/:id")
    public findLobby(@Param("id") id: string): LobbyDto | undefined {
        const lobbyModel = this.lobbyService.findById(id);
        if (!lobbyModel) return undefined;
        return this.lobbyModelToDto(lobbyModel);
    }

    @Post("/lobby/create")
    public createLobby(@Body() createLobbyDto: CreateLobbyDto): LobbyDto {
        const lobbyModel = this.lobbyService.create(createLobbyDto);
        return this.lobbyModelToDto(lobbyModel);
    }

    @Post("/lobby/:id/join")
    public async joinLobby(@Param("id") id: string, @Body() joinLobbyDto: JoinLobbyDto): Promise<LobbyDto | undefined> {
        throw new NotImplementedException();
    }

    @Post("/lobby/:id/update")
    public async updateLobby(@Param("id") id: string, @Body() updateLobbyDto: UpdateLobbyDto): Promise<LobbyDto> {
        throw new NotImplementedException();
    }

    @Post("/lobby/:id/update-player")
    public updatePlayerInLobby(
        @Param("id") id: string,
        @Body() updatePlayerInLobbyDto: UpdatePlayerInLobbyDto,
    ): Promise<LobbyDto> {
        throw new NotImplementedException();
    }

    @Post("/lobby/:id/leave")
    public async leaveLobby(@Param("id") id: string): Promise<void> {}

    private lobbyModelToDto(model: LobbyModel): LobbyDto {
        return {
            lobbyId: model.lobbyId,
            players: [],
            private: model.private,
        };
    }
}
