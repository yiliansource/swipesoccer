import { TypeOrmModule } from "@nestjs/typeorm";

export function getTestDatabaseModule() {
    return TypeOrmModule.forRoot({
        type: "mysql",
        host: "localhost",
        port: 3306,
        username: "root",
        password: "root",
        database: "swipesoccer_test",
        entities: ["../**/*.entity.ts"],
        synchronize: true,
    });
}
