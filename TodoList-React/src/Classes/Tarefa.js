/* eslint-disable no-unused-vars */
class Tarefa {
        constructor(paramId,paramStatus,paramTarefa,paramData,parammodificacao,paramvalidade,paramexpiracao,paramconclusao,paramQtdeModificacao){
            this.Id = paramId;
            this.Status = paramStatus;
            this.Tarefa = paramTarefa;
            this.Data = paramData;
            this.Modificacao = parammodificacao;
            this.Validade = paramvalidade;
            this.Expiracao = paramexpiracao;
            this.Conclusao = paramconclusao;
            this.QtdeModificacao = paramQtdeModificacao;
        }

        EqualsDate(date){
            if(date == undefined || date == null){
                return false;
            }
            return this.Data.Data == date.Data && this.Data.Ano == date.Ano && this.Data.Mes[0] == date.Mes[0] && this.Data.Horas == date.Horas && this.Data.Minutos == date.Minutos && this.Data.Segundos == date.Segundos && this.Data.Dia == date.Dia;
        }

        static GetDefaultDate(date){
            return new Date(date.Ano,(date.Mes[0] - 1),date.Data,date.Horas,date.Minutos,date.Segundos,0);
        }

        static GetDateObject(date){
            let months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
            let day = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
            let ObjectDateItem = 
            { 
                "Ano" : date.getFullYear(), 
                "Mes" : [date.getMonth() + 1, months[date.getMonth()]],
                "Data" : date.getDate(), 
                "Horas" : date.getHours(), 
                "Minutos" : date.getMinutes(), 
                "Segundos" : date.getSeconds(), 
                "Dia" : day[date.getDay()],
                "ToStringShort":function()
                {
                    return Tarefa.GetNumberHorsCorrecty(date.getDate()) +"/"+ Tarefa.GetNumberHorsCorrecty((date.getMonth() + 1)) +"/" +date.getFullYear();
                },
                "ToString":function()
                {
                    return Tarefa.GetNumberHorsCorrecty(date.getDate()) +"/"+ Tarefa.GetNumberHorsCorrecty((date.getMonth() + 1)) +"/" +date.getFullYear() +" às " + Tarefa.GetNumberHorsCorrecty(date.getHours())  +":"+ Tarefa.GetNumberHorsCorrecty(date.getMinutes()) +":"+ Tarefa.GetNumberHorsCorrecty(date.getSeconds());
                },
                "DateDefault":function(){return this.GetDefaultDate(ObjectDateItem)}
            };
            return ObjectDateItem;
        }

        static GetNumberHorsCorrecty(number){
            return number <= 9? "0"+ number : number;
        }

        static AddDaysInDateObject(date,days){
            let ano = date.Ano;
            let mes = date.Mes[0];
            let data = date.Data;
            let horas = date.Horas;
            let minutos = date.Minutos;
            let segundos = date.Segundos;
            let newDate = new Date(ano,mes -1,data,horas,minutos,segundos,0);
            newDate.setDate(newDate.getDate() + days);
            return this.GetDateObject(newDate);
        }   

        GetDate(number){
            return Tarefa.GetNumberHorsCorrecty(number);
        }

        ToString(){
            return "Id: " + this.Id + 
            ", Tarefa: " + this.Tarefa + 
            ", Criado em: " + this.GetDate(this.Data.Data) + "/" + this.GetDate(this.Data.Mes[0]) + "/" + this.Data.Ano + 
            " Modificado em: " + this.GetDate(this.Modificacao.Data) + "/" + this.GetDate(this.Modificacao.Mes[0]) + "/" + this.Modificacao.Ano;
        }
}

export default Tarefa